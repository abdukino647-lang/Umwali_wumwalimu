/**
 * useSpeaker — Original Kinyarwanda Text-to-Speech hook for the exam engine.
 *
 * Uses `/api/tts` (backed by Pindo VoiceAI native Kinyarwanda `rw`, with Edge CDN
 * + PWA caching) and plays audio via a persistent unlocked HTMLAudioElement.
 *
 * Design goals for a 60-second-per-question exam:
 *   1. Authentic Kinyarwanda only — zero French/English fallback.
 *   2. Brisk, clear speed (`speech_rate=1.25`, `playbackRate=1.1`) so full
 *      question + 4 options finish in ~10–13 s, leaving ~45+ s to think.
 *   3. Pipelined fetching + next-question prefetching so advancing to the next
 *      question plays with zero wait ("in realtime and quick").
 *   4. Mobile-safe audio unlock inside user gestures (iOS Safari / Chrome Android).
 *   5. Stops immediately when the user selects an answer, toggles off, finishes,
 *      or leaves the page.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildQuestionSpeechSegments,
  SpeechQuestion,
} from "@/lib/kinyarwanda-tts-normalizer";

export type { SpeechQuestion as SpeakerQuestion };

const STORAGE_KEY = "exam_speaker";
const UPSTREAM_RATE = 1.25;
const CLIENT_PLAYBACK_RATE = 1.1;
const MAX_BLOB_CACHE = 120;

// Tiny 44-byte valid silent mono WAV to unlock HTMLAudioElement inside user clicks
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export function useSpeaker() {
  // Always false on initial render to guarantee SSR/CSR hydration parity;
  // restored from localStorage right after mount.
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabledRef = useRef(false);
  enabledRef.current = enabled;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  // Incremented on stop() or read() so older async chains exit cleanly
  const sessionIdRef = useRef(0);
  // Segment text -> Promise resolving to a Blob object URL
  const segmentCacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const resolvedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    setSupported(true);

    const el = new Audio();
    el.preload = "auto";
    // Retain natural pitch when speeding up slightly
    (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch =
      true;
    audioRef.current = el;

    if (localStorage.getItem(STORAGE_KEY) === "1") {
      enabledRef.current = true;
      setEnabled(true);
    }

    return () => {
      sessionIdRef.current++;
      el.pause();
      el.removeAttribute("src");
      audioRef.current = null;
      for (const u of resolvedUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
      resolvedUrlsRef.current = [];
      segmentCacheRef.current.clear();
    };
  }, []);

  /**
   * Must be invoked inside a synchronous click/tap handler on mobile Safari/Chrome
   * so subsequent async `.play()` calls for auto-read succeed without NotAllowedError.
   */
  const unlock = useCallback(() => {
    const el = audioRef.current;
    if (!el || unlockedRef.current) return;
    const unlockSession = sessionIdRef.current;
    try {
      el.src = SILENT_WAV_DATA_URI;
      el.volume = 0;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          // Only pause the silent clip if read()/stop() hasn't already taken over el.src
          if (sessionIdRef.current === unlockSession && el.src === SILENT_WAV_DATA_URI) {
            el.pause();
          }
          el.volume = 1;
          unlockedRef.current = true;
        }).catch(() => {
          el.volume = 1;
        });
      } else {
        unlockedRef.current = true;
        el.volume = 1;
      }
    } catch {
      el.volume = 1;
    }
  }, []);

  const fetchSegmentUrl = useCallback((segmentText: string): Promise<string> => {
    const existing = segmentCacheRef.current.get(segmentText);
    if (existing) return existing;

    const promise = (async () => {
      const params = new URLSearchParams({
        text: segmentText,
        rate: String(UPSTREAM_RATE),
      });
      const res = await fetch(`/api/tts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`TTS HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size <= 44) {
        throw new Error("Empty audio");
      }
      const objectUrl = URL.createObjectURL(blob);
      resolvedUrlsRef.current.push(objectUrl);

      // Evict oldest blobs if cache grows too large
      while (resolvedUrlsRef.current.length > MAX_BLOB_CACHE) {
        const oldest = resolvedUrlsRef.current.shift();
        if (oldest) URL.revokeObjectURL(oldest);
      }
      return objectUrl;
    })().catch((err) => {
      // Remove failed entry so subsequent attempts can retry cleanly
      segmentCacheRef.current.delete(segmentText);
      throw err;
    });

    // Keep map bounded
    if (segmentCacheRef.current.size >= MAX_BLOB_CACHE) {
      const oldestKey = segmentCacheRef.current.keys().next().value;
      if (oldestKey !== undefined) segmentCacheRef.current.delete(oldestKey);
    }
    segmentCacheRef.current.set(segmentText, promise);
    return promise;
  }, []);

  const stop = useCallback(() => {
    sessionIdRef.current++;
    const el = audioRef.current;
    if (el) {
      el.onended = null;
      el.onerror = null;
      el.pause();
      try {
        el.currentTime = 0;
      } catch {}
    }
    setLoading(false);
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    unlock();
    setEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      if (!next) {
        stop();
        setError(null);
      }
      return next;
    });
  }, [stop, unlock]);

  /** Play a single resolved Blob URL on the persistent audio element. */
  const playUrl = useCallback(
    (url: string, sessionId: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const el = audioRef.current;
        if (!el || sessionIdRef.current !== sessionId) {
          resolve();
          return;
        }

        el.onended = () => resolve();
        el.onerror = () => reject(new Error("Audio playback failed"));
        el.src = url;
        el.volume = 1;
        el.playbackRate = CLIENT_PLAYBACK_RATE;

        const playPromise = el.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => reject(err));
        }
      });
    },
    []
  );

  /**
   * Read a question + its options aloud in native Kinyarwanda.
   * Optionally accepts `nextQuestion` to warm the cache sequentially in the background
   * once the current question's chunks are queued.
   */
  const read = useCallback(
    (q: SpeechQuestion, nextQ?: SpeechQuestion) => {
      if (!enabledRef.current || !audioRef.current) return;

      const mySession = ++sessionIdRef.current;
      // Pause any previous audio cleanly without wiping its cached promise
      const el = audioRef.current;
      el.onended = null;
      el.onerror = null;
      el.pause();

      const segments = buildQuestionSpeechSegments(q);
      if (segments.length === 0) return;

      setError(null);
      setLoading(true);
      setSpeaking(false);

      // Sequentially warm upcoming segments & next question so we don't burst upstream,
      // while Segment 0 downloads and plays immediately.
      const backgroundQueue = [
        ...segments.slice(1),
        ...(nextQ ? buildQuestionSpeechSegments(nextQ) : []),
      ];

      const runBackgroundPrefetch = async () => {
        for (const seg of backgroundQueue) {
          if (sessionIdRef.current !== mySession) return;
          try {
            await fetchSegmentUrl(seg);
          } catch {
            // Non-fatal; playback loop handles retries if needed
          }
        }
      };

      void (async () => {
        try {
          // 1. Fetch Question stem first for fastest time-to-first-sound
          const firstUrl = await fetchSegmentUrl(segments[0]);
          if (sessionIdRef.current !== mySession || !enabledRef.current) return;

          // Kick off option + next-question prefetching as soon as Q0 arrives
          void runBackgroundPrefetch();

          setLoading(false);
          setSpeaking(true);
          await playUrl(firstUrl, mySession);

          // 2. Play remaining option segments seamlessly
          for (let i = 1; i < segments.length; i++) {
            if (sessionIdRef.current !== mySession || !enabledRef.current) return;
            const nextUrl = await fetchSegmentUrl(segments[i]);
            if (sessionIdRef.current !== mySession || !enabledRef.current) return;
            await playUrl(nextUrl, mySession);
          }

          if (sessionIdRef.current === mySession) {
            setSpeaking(false);
          }
        } catch (err) {
          if (sessionIdRef.current === mySession) {
            setLoading(false);
            setSpeaking(false);
            const msg = err instanceof Error ? err.message : "";
            // Autoplay blocked -> prompt user subtly to tap once
            if (msg.toLowerCase().includes("notallowed") || msg.toLowerCase().includes("interact")) {
              setError("Kanda akamenyetso k'ijwi kugira ngo utangire kumva");
            } else {
              setError("Ntibishoboye gusoma ubu — kanda kuri akamenyetso wongere ugerageze");
            }
          }
        }
      })();
    },
    [fetchSegmentUrl, playUrl]
  );

  return {
    enabled,
    supported,
    loading,
    speaking,
    error,
    toggle,
    unlock,
    read,
    stop,
  };
}
