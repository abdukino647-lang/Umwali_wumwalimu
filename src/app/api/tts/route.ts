/**
 * GET /api/tts?text=...&rate=1.0&v=3
 *
 * Original Kinyarwanda Text-to-Speech proxy — single Pindo VoiceAI voice ONLY.
 *
 * Why a single-voice server proxy:
 *   1. Browsers lack a reliable Kinyarwanda (rw-RW) Web Speech voice and mix
 *      English/French phonetics. Non-Kinyarwanda fallbacks (like Gemini Kore)
 *      also mispronounce Kinyarwanda and introduce inconsistent voices.
 *   2. Pindo VoiceAI (`/ai/tts/rw`) provides native Rwandan speech, and passing
 *      our selected reference clip (`RW_REFERENCE_VOICE_WAV_B64`, F0 ~200 Hz
 *      calm speaker from test_audio.wav) requests this single consistent voice.
 *   3. Gentle server-side PCM RMS/peak normalization keeps loudness steady
 *      across questions, options, and explanations without hardening the warm
 *      vocal tone.
 *
 * Responses use `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
 * so Vercel Edge CDN & client/PWA cache serve repeated segments in <50 ms.
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanForKinyarwandaSpeech } from "@/lib/kinyarwanda-tts-normalizer";
import { RW_REFERENCE_VOICE_WAV_B64 } from "@/lib/rw-reference-voice";

export const maxDuration = 25;

const MAX_CHARS = 320;
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

const AUDIO_HEADERS = {
  "Content-Type": "audio/wav",
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

/** Synthesize strictly via Pindo VoiceAI using the selected single Kinyarwanda voice. */
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

  let includeRefAudio = true;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const payload = JSON.stringify({
        text,
        ...(token ? { lang: "rw" } : {}),
        speech_rate: rate,
        ...(includeRefAudio ? { audio: RW_REFERENCE_VOICE_WAV_B64 } : {}),
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(11000),
      });

      if (!res.ok) {
        // If upstream rejects the optional `audio` field with 400, retry once cleanly without it
        if (res.status === 400 && includeRefAudio && attempt === 0) {
          includeRefAudio = false;
          continue;
        }
        // Retry once on transient 5xx, but never hammer 429 rate limits
        if (res.status >= 500 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 250));
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
        await new Promise((r) => setTimeout(r, 250));
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
    ? Math.min(1.25, Math.max(0.85, Number(parsedRate.toFixed(2))))
    : 1.0;

  const cacheKey = `v3|${rate}|${text}`;
  const cached = memoryAudioCache.get(cacheKey);
  if (cached) {
    return new NextResponse(Buffer.from(cached), {
      status: 200,
      headers: AUDIO_HEADERS,
    });
  }

  const audio = await synthesizeWithPindo(text, rate);

  if (!audio) {
    return NextResponse.json(
      { error: "Ntibishoboye kubyara ijwi ry'Ikinyarwanda ubu" },
      { status: 502 }
    );
  }

  setMemoryCache(cacheKey, audio);

  return new NextResponse(Buffer.from(audio), {
    status: 200,
    headers: AUDIO_HEADERS,
  });
}
