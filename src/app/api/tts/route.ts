/**
 * GET /api/tts?text=...&rate=1.0&v=6
 *
 * Kinyarwanda Text-to-Speech proxy.
 *
 * Voice strategy (priority order):
 *   1. HuggingFace `facebook/mms-tts-kin` — SINGLE-SPEAKER model, voice NEVER
 *      changes. Requires HF_API_TOKEN env var (free HuggingFace account).
 *      Returns audio/flac which all modern browsers can play natively.
 *   2. Pindo VoiceAI (`/ai/tts/rw`) — multi-speaker pool but reference-audio
 *      anchoring keeps it mostly consistent. Used when HF is unavailable or
 *      times out. PINDO_API_TOKEN env var optional (falls back to public endpoint).
 *
 * Gentle server-side PCM RMS/peak normalization keeps loudness steady across
 * questions, options, and explanations without hardening the warm vocal tone.
 *
 * Responses use `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
 * so Vercel Edge CDN & client/PWA cache serve repeated segments in <50 ms.
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanForKinyarwandaSpeech } from "@/lib/kinyarwanda-tts-normalizer";
import { RW_REFERENCE_VOICE_WAV_B64 } from "@/lib/rw-reference-voice";

export const maxDuration = 30;

// Raised to 420 to accommodate the new combined-options segment format:
// "Hitamo. A, [text]. Be, [text]. Se, [text]. De, [text]." can reach ~400 chars.
const MAX_CHARS = 420;
const MEM_CACHE_MAX = 300;
const TARGET_SPEECH_RMS = 4000;
const PEAK_CEILING = 29500;

const memoryAudioCache = new Map<string, Uint8Array>();

function setMemoryCache(key: string, bytes: Uint8Array) {
  if (memoryAudioCache.size >= MEM_CACHE_MAX) {
    const oldest = memoryAudioCache.keys().next().value;
    if (oldest !== undefined) memoryAudioCache.delete(oldest);
  }
  memoryAudioCache.set(key, bytes);
}

const AUDIO_HEADERS_WAV = {
  "Content-Type": "audio/wav",
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "Accept-Ranges": "bytes",
} as const;

const AUDIO_HEADERS_FLAC = {
  "Content-Type": "audio/flac",
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
  "Accept-Ranges": "bytes",
} as const;

/**
 * Normalize active-speech RMS loudness and prevent peak clipping across
 * 16-bit PCM WAV files in <2 ms so every question, option, and explanation
 * plays back at a steady, comfortable volume.
 */
function normalizeWavLoudness(wavBytes: Uint8Array): Uint8Array {
  if (wavBytes.byteLength < 44) return wavBytes;

  const view = new DataView(
    wavBytes.buffer,
    wavBytes.byteOffset,
    wavBytes.byteLength
  );

  const readFourCC = (off: number) =>
    String.fromCharCode(
      wavBytes[off],
      wavBytes[off + 1],
      wavBytes[off + 2],
      wavBytes[off + 3]
    );

  if (readFourCC(0) !== "RIFF" || readFourCC(8) !== "WAVE") {
    return wavBytes;
  }

  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= wavBytes.byteLength) {
    const chunkId = readFourCC(offset);
    const chunkSize = view.getUint32(offset + 4, true);
    const payloadStart = offset + 8;
    const clampedSize = Math.min(chunkSize, wavBytes.byteLength - payloadStart);

    if (chunkId === "fmt " && clampedSize >= 16) {
      bitsPerSample = view.getUint16(payloadStart + 14, true);
    } else if (chunkId === "data") {
      dataOffset = payloadStart;
      dataSize = clampedSize;
      break;
    }

    offset = payloadStart + chunkSize + (chunkSize & 1);
  }

  if (bitsPerSample !== 16 || dataOffset < 0 || dataSize < 4) {
    return wavBytes;
  }

  const sampleCount = Math.floor(dataSize / 2);
  let activeSumSq = 0;
  let activeCount = 0;
  let maxAbs = 0;

  for (let i = 0; i < sampleCount; i++) {
    const s = view.getInt16(dataOffset + i * 2, true);
    const abs = s < 0 ? -s : s;
    if (abs > maxAbs) maxAbs = abs;
    if (abs > 300) {
      activeSumSq += s * s;
      activeCount++;
    }
  }

  if (activeCount < 80 || maxAbs === 0) return wavBytes;

  const activeRms = Math.sqrt(activeSumSq / activeCount);
  if (activeRms < 100) return wavBytes;

  let gain = TARGET_SPEECH_RMS / activeRms;
  gain = Math.min(1.4, Math.max(0.75, gain));
  if (maxAbs * gain > PEAK_CEILING) {
    gain = PEAK_CEILING / maxAbs;
  }

  if (Math.abs(gain - 1.0) < 0.05) return wavBytes;

  const out = new Uint8Array(wavBytes);
  const outView = new DataView(out.buffer, out.byteOffset, out.byteLength);
  for (let i = 0; i < sampleCount; i++) {
    const s = view.getInt16(dataOffset + i * 2, true);
    const scaled = Math.max(-32768, Math.min(32767, Math.round(s * gain)));
    outView.setInt16(dataOffset + i * 2, scaled, true);
  }
  return out;
}

/**
 * Synthesize via HuggingFace `facebook/mms-tts-kin` — a SINGLE-SPEAKER VITS model.
 * This guarantees one consistent voice every time, unlike Pindo's speaker pool.
 *
 * Returns raw audio bytes (audio/flac) on success, null on failure.
 * Requires HF_API_TOKEN env var (free HuggingFace account at huggingface.co).
 */
async function synthesizeWithHuggingFace(
  text: string
): Promise<Uint8Array | null> {
  const hfToken = process.env.HF_API_TOKEN;
  if (!hfToken) return null;

  // HuggingFace serverless inference cold-starts the model on first request,
  // returning HTTP 503 with {"estimated_time": N} while loading.
  // We retry up to 3 times with backoff (1s, 3s) to ride through cold starts.
  const MAX_HF_ATTEMPTS = 3;
  const HF_RETRY_DELAYS = [1000, 3000];

  for (let attempt = 0; attempt < MAX_HF_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/facebook/mms-tts-kin",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
            Accept: "audio/flac",
          },
          // wait_for_model=true tells HF to hold the request until model is ready
          // instead of returning 503 — saves a round-trip on cold start.
          body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
          signal: AbortSignal.timeout(25000),
        }
      );

      // 503 = model loading; retry after the suggested delay
      if (res.status === 503) {
        if (attempt < MAX_HF_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, HF_RETRY_DELAYS[attempt] ?? 2000));
          continue;
        }
        return null;
      }

      if (!res.ok) return null;

      const contentType = res.headers.get("content-type") ?? "";
      // HF returns audio/flac or audio/wav depending on model version
      if (!contentType.includes("audio")) return null;

      const bytes = new Uint8Array(await res.arrayBuffer());
      // Minimum valid audio file size (larger than an empty/error response)
      if (bytes.byteLength < 100) return null;
      return bytes;
    } catch {
      if (attempt < MAX_HF_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, HF_RETRY_DELAYS[attempt] ?? 1000));
        continue;
      }
      return null;
    }
  }

  return null;
}

/**
 * Synthesize strictly via Pindo VoiceAI using the SINGLE selected Kinyarwanda voice.
 *
 * The reference audio (`RW_REFERENCE_VOICE_WAV_B64`) is ALWAYS included in every
 * request — this is the ONLY mechanism that anchors the output to the chosen
 * ~200 Hz calm female speaker (from test_audio.wav). Dropping it even once lets
 * Pindo pick a random voice. We therefore:
 *   - Build the payload with `audio` unconditionally before the retry loop.
 *   - Never retry without the reference on HTTP 400 (treat 4xx as a text issue,
 *     return null so the caller can skip/handle, not fall back to a random voice).
 *   - Only retry once on transient 5xx server errors.
 */
async function synthesizeWithPindo(
  text: string,
  rate: number
): Promise<Uint8Array | null> {
  const token = process.env.PINDO_API_TOKEN;
  const endpoint = token
    ? "https://api.pindo.io/ai/tts/rw"
    : "https://api.pindo.io/ai/tts/rw/public";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Reference audio ALWAYS included — the ONLY way to lock to the selected voice.
  const payload = JSON.stringify({
    text,
    ...(token ? { lang: "rw" } : {}),
    speech_rate: rate,
    audio: RW_REFERENCE_VOICE_WAV_B64,
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        // Only retry transient 5xx once. Never retry 400/429 — they indicate a
        // text or rate-limit problem, not a transient server issue. Crucially,
        // we do NOT retry without the reference audio on 400 (old behaviour that
        // caused voice randomization).
        if (res.status >= 500 && res.status < 600 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        return null;
      }

      const json = (await res.json()) as {
        status?: string;
        data?: { generated_audio_url?: string };
      };
      const audioUrl = json?.data?.generated_audio_url;
      if (!audioUrl || !audioUrl.startsWith("https://")) return null;

      const wavRes = await fetch(audioUrl, {
        signal: AbortSignal.timeout(10000),
      });
      if (!wavRes.ok) return null;

      const bytes = new Uint8Array(await wavRes.arrayBuffer());
      if (bytes.byteLength <= 44) return null;
      return normalizeWavLoudness(bytes);
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      return null;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const rawText = req.nextUrl.searchParams.get("text") ?? "";
  if (!rawText.trim()) {
    return new NextResponse(null, { status: 204 });
  }

  const text = cleanForKinyarwandaSpeech(rawText).slice(0, MAX_CHARS).trim();
  if (!text) {
    return new NextResponse(null, { status: 204 });
  }

  const parsedRate = Number(req.nextUrl.searchParams.get("rate") ?? "1.0");
  const rate = Number.isFinite(parsedRate)
    ? Math.min(1.25, Math.max(0.75, Number(parsedRate.toFixed(2))))
    : 1.0;

  const cacheKey = `v9|${rate}|${text}`;
  const cached = memoryAudioCache.get(cacheKey);
  if (cached) {
    // We store [1 isFlac byte, ...audio bytes] to remember content type
    const isFlac = cached[0] === 1;
    const audioBytes = cached.slice(1);
    return new NextResponse(Buffer.from(audioBytes), {
      status: 200,
      headers: isFlac ? AUDIO_HEADERS_FLAC : AUDIO_HEADERS_WAV,
    });
  }

  // ── Voice priority ─────────────────────────────────────────────────────────
  // 1. Pindo VoiceAI + reference audio — the most natural, human-sounding
  //    Kinyarwanda voice. Reference clip anchors it to our chosen calm speaker.
  //    This is the voice the user knows sounds best.
  // 2. HuggingFace MMS-TTS — single-speaker fallback when Pindo is unavailable
  //    (rate-limited, 5xx). Consistent but more synthetic-sounding.
  // ──────────────────────────────────────────────────────────────────────────
  let audio: Uint8Array | null = null;
  let isFlac = false;

  audio = await synthesizeWithPindo(text, rate);
  if (!audio) {
    // Pindo failed — try HF as fallback for uninterrupted reading
    const hfAudio = await synthesizeWithHuggingFace(text);
    if (hfAudio) {
      audio = hfAudio;
      isFlac = true;
    }
  }

  if (!audio) {
    return NextResponse.json(
      { error: "Ntibishoboye kubyara ijwi ry'Ikinyarwanda ubu" },
      { status: 502 }
    );
  }

  // Prepend a 1-byte flag so the cache knows the content type on retrieval.
  const flagged = new Uint8Array(1 + audio.byteLength);
  flagged[0] = isFlac ? 1 : 0;
  flagged.set(audio, 1);
  setMemoryCache(cacheKey, flagged);

  return new NextResponse(Buffer.from(audio), {
    status: 200,
    headers: isFlac ? AUDIO_HEADERS_FLAC : AUDIO_HEADERS_WAV,
  });
}
