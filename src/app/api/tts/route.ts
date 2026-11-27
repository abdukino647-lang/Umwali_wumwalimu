/**
 * GET /api/tts?text=...&rate=1.25
 *
 * Original Kinyarwanda Text-to-Speech proxy.
 *
 * Why a server proxy instead of browser Web Speech API:
 *   Most desktop & mobile browsers lack a native Kinyarwanda (rw-RW) voice and
 *   quietly fall back to English or French phonetics. This endpoint routes text
 *   exclusively to genuine Kinyarwanda voice engines:
 *
 *     1. Pindo VoiceAI (rw — native Rwandan Kinyarwanda speaker)
 *        - Uses authenticated endpoint (PINDO_API_TOKEN) when set,
 *          otherwise falls back to Pindo's public rw endpoint.
 *     2. Optional Google Gemini Native Audio TTS fallback (ONLY if Pindo is
 *        rate-limited/unavailable AND GEMINI_API_KEY is configured).
 *
 * Responses use `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
 * so Vercel Edge CDN & client/PWA cache serve repeated exam questions in <50 ms.
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanForKinyarwandaSpeech } from "@/lib/kinyarwanda-tts-normalizer";

export const maxDuration = 15;

const MAX_CHARS = 320;
const MEM_CACHE_MAX = 250;

// Lightweight per-instance audio cache to speed up warm serverless hits
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

/** Wrap raw 24 kHz mono 16-bit PCM (from Gemini TTS) inside a standard 44-byte RIFF/WAV header. */
function pcm16ToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, pcm.byteLength, true);

  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return out;
}

/** Synthesize via Pindo VoiceAI (native Rwandan Kinyarwanda). */
async function synthesizeWithPindo(text: string, rate: number): Promise<Uint8Array | null> {
  const token = process.env.PINDO_API_TOKEN;
  const endpoint = token
    ? "https://api.pindo.io/ai/tts/rw"
    : "https://api.pindo.io/ai/tts/rw/public";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payload = JSON.stringify({
    text,
    ...(token ? { lang: "rw" } : {}),
    speech_rate: rate,
  });

  // Allow 1 quick retry on transient upstream hiccup
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(8500),
      });

      if (!res.ok) {
        if ((res.status >= 500 || res.status === 429) && attempt === 0) {
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

      const wavRes = await fetch(audioUrl, { signal: AbortSignal.timeout(8500) });
      if (!wavRes.ok) return null;

      const bytes = new Uint8Array(await wavRes.arrayBuffer());
      return bytes.byteLength > 44 ? bytes : null;
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

/** Optional fallback via Gemini Native Audio TTS (if GEMINI_API_KEY is configured). */
async function synthesizeWithGemini(text: string): Promise<Uint8Array | null> {
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!geminiKey) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(9500),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read quickly and clearly in native Rwandan Kinyarwanda pronunciation (rw-RW), with zero English or French accent: ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const b64: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return null;

    const pcm = Uint8Array.from(Buffer.from(b64, "base64"));
    return pcm.byteLength > 0 ? pcm16ToWav(pcm, 24000) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const rawText = req.nextUrl.searchParams.get("text") ?? "";
  if (!rawText.trim()) {
    return new NextResponse(null, { status: 204 });
  }

  // Normalize so raw query strings still get pure Kinyarwanda pronunciation
  const text = cleanForKinyarwandaSpeech(rawText).slice(0, MAX_CHARS).trim();
  if (!text) {
    return new NextResponse(null, { status: 204 });
  }

  const parsedRate = Number(req.nextUrl.searchParams.get("rate") ?? "1.2");
  const rate = Number.isFinite(parsedRate)
    ? Math.min(1.4, Math.max(0.85, Number(parsedRate.toFixed(2))))
    : 1.2;

  const cacheKey = `${rate}|${text}`;
  const cached = memoryAudioCache.get(cacheKey);
  if (cached) {
    return new NextResponse(Buffer.from(cached), {
      status: 200,
      headers: AUDIO_HEADERS,
    });
  }

  const audio =
    (await synthesizeWithPindo(text, rate)) ??
    (await synthesizeWithGemini(text));

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
