/**
 * useSpeaker — Single-voice Kinyarwanda Text-to-Speech hook for Amategeko y'Umuhanda.
 *
 * Uses `/api/tts?v=4` (exclusively backed by the single curated Pindo VoiceAI
 * Kinyarwanda speaker, with loudness normalization + Edge CDN & PWA caching).
 *
 * Key properties:
 *   1. One consistent native Kinyarwanda voice across questions, options,
 *      explanations, and instructions — zero fallback to foreign voices.
 *   2. Natural, unhurried speaking pace (`speech_rate=1.0`, `playbackRate=1.0`)
 *      with brief human breath pauses (320ms after question, 180ms between
 *      option segments) for effortless comprehension.
 *   3. Professional option reading: "Hitamo." is said ONCE after the question,
 *      then all four options as "A, [text]. Be, [text]. Se, [text]. De, [text]."
 *      — packed into one or two API calls (never four separate "Hitamo rya X" calls).
 *   4. Zero network wait between Question and Options: options start fetching in
 *      staggered parallel while the question stem loads & plays.
 *   5. True Pause / Resume mid-playback without disrupting quiz progress.
 *   6. Strict session cancellation so rapid clicks/navigation never cause
 *      overlapping, duplicated, or interrupted speech.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildExplanationSpeechSegments,
  buildQuestionSpeechPlan,
  SpeechQuestion,
} from "@/lib/kinyarwanda-tts-normalizer";

export type { SpeechQuestion as SpeakerQuestion };
export type SpeakerStage = "idle" | "question" | "options" | "explanation";

const STORAGE_KEY = "exam_speaker";
const UPSTREAM_RATE = 0.88; // Slightly slower than Pindo default for clear, natural Kinyarwanda
const CLIENT_PLAYBACK_RATE = 1.0;
const TTS_CACHE_VERSION = "6"; // bumped: HF MMS-TTS primary + normalization fixes (metero50, sign codes)
const MAX_BLOB_CACHE = 140;

const GAP_QUESTION_TO_OPTIONS_MS = 320;
const GAP_BETWEEN_SEGMENTS_MS = 180;
const OPTION_PREFETCH_STAGGER_MS = 130;

// Tiny 44-byte valid silent mono WAV to unlock HTMLAudioElement inside user clicks
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export function useSpeaker() {
  // Initial render stays false for SSR/CSR parity; restored from localStorage after mount.
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<SpeakerStage>("idle");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabledRef = useRef(false);
  enabledRef.current = enabled;

  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const sessionIdRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pauseWaitersRef = useRef<(() => void)[]>([]);

  // Segment text -> Promise resolving to a Blob object URL
  const segmentCacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const resolvedUrlsRef = useRef<string[]>([]);

  const clearScheduledTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const releasePauseWaiters = useCallback(() => {
    const waiters = pauseWaitersRef.current;
    pauseWaitersRef.current = [];
    for (const resolve of waiters) resolve();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    setSupported(true);

    const el = new Audio();
    el.preload = "auto";
    (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch =
      true;
    audioRef.current = el;

    if (localStorage.getItem(STORAGE_KEY) === "1") {
      enabledRef.current = true;
      setEnabled(true);
    }

    return () => {
      sessionIdRef.current++;
      clearScheduledTimers();
      releasePauseWaiters();
      el.onended = null;
      el.onerror = null;
      el.pause();
      el.removeAttribute("src");
      audioRef.current = null;
      for (const u of resolvedUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
      resolvedUrlsRef.current = [];
      segmentCacheRef.current.clear();
    };
  }, [clearScheduledTimers, releasePauseWaiters]);

  /**
   * Must be invoked inside a synchronous tap/click handler on mobile Safari/Chrome
   * so async `.play()` calls succeed without NotAllowedError.
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
          if (
            sessionIdRef.current === unlockSession &&
            el.src === SILENT_WAV_DATA_URI
          ) {
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

    async function attemptFetch(): Promise<string> {
      const params = new URLSearchParams({
        text: segmentText,
        rate: String(UPSTREAM_RATE),
        v: TTS_CACHE_VERSION,
      });
      const res = await fetch(`/api/tts?${params.toString()}`);
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size <= 44) throw new Error("Empty audio");
      const objectUrl = URL.createObjectURL(blob);
      resolvedUrlsRef.current.push(objectUrl);
      while (resolvedUrlsRef.current.length > MAX_BLOB_CACHE) {
        const oldest = resolvedUrlsRef.current.shift();
        if (oldest) URL.revokeObjectURL(oldest);
      }
      return objectUrl;
    }

    // Auto-retry once after 1.5 s on any transient Pindo error (HTTP 500, empty audio, etc.)
    // so the user never sees the error banner on the first hiccup.
    const promise = attemptFetch()
      .catch(async () => {
        segmentCacheRef.current.delete(segmentText);
        await new Promise<void>((r) => setTimeout(r, 1500));
        return attemptFetch();
      })
      .catch((err: unknown) => {
        segmentCacheRef.current.delete(segmentText);
        throw err;
      });

    if (segmentCacheRef.current.size >= MAX_BLOB_CACHE) {
      const oldestKey = segmentCacheRef.current.keys().next().value;
      if (oldestKey !== undefined) segmentCacheRef.current.delete(oldestKey);
    }
    segmentCacheRef.current.set(segmentText, promise);
    return promise;
  }, []);

  const stop = useCallback(() => {
    sessionIdRef.current++;
    clearScheduledTimers();
    pausedRef.current = false;
    setPaused(false);
    releasePauseWaiters();

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
    setStage("idle");
    setActiveId(null);
  }, [clearScheduledTimers, releasePauseWaiters]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (!el || (!speakingRef.current && !pausedRef.current)) return;
    pausedRef.current = true;
    setPaused(true);
    setSpeaking(false);
    el.pause();
  }, []);

  const resume = useCallback(() => {
    const el = audioRef.current;
    if (!el || !pausedRef.current) return;
    unlock();
    pausedRef.current = false;
    setPaused(false);
    setSpeaking(true);
    releasePauseWaiters();

    if (el.src && el.src !== SILENT_WAV_DATA_URI && el.paused && !el.ended) {
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          setError("Kanda akamenyetso k'ijwi wongere ukomeze kumva");
        });
      }
    }
  }, [releasePauseWaiters, unlock]);

  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      resume();
    } else if (speakingRef.current) {
      pause();
    }
  }, [pause, resume]);

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

  /** Wait until playback is no longer paused, or return immediately if session ended. */
  const waitIfPaused = useCallback((sessionId: number): Promise<void> => {
    if (!pausedRef.current || sessionIdRef.current !== sessionId) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      pauseWaitersRef.current.push(resolve);
    });
  }, []);

  /** Sleep for a brief natural breath pause while respecting cancellation & pause state. */
  const waitNaturalPause = useCallback(
    async (ms: number, sessionId: number): Promise<void> => {
      if (ms <= 0 || sessionIdRef.current !== sessionId) return;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        timersRef.current.push(timer);
      });
      await waitIfPaused(sessionId);
    },
    [waitIfPaused]
  );

  /** Play a single resolved Blob URL on the persistent unlocked audio element. */
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

  /** Shared sequential segment player with clean pause handling and natural pacing. */
  const playSegmentSequence = useCallback(
    async (
      mySession: number,
      segments: string[],
      questionSegmentCount: number,
      baseStage: "question" | "explanation",
      nextQSegments?: string[]
    ) => {
      try {
        // Kick off segment 0 immediately, then stagger remaining chunks of this
        // question slightly so options are ALREADY buffered before stem ends.
        const segPromises: Promise<string>[] = new Array(segments.length);
        segPromises[0] = fetchSegmentUrl(segments[0]);

        for (let i = 1; i < segments.length; i++) {
          segPromises[i] = new Promise<string>((resolve, reject) => {
            const timer = setTimeout(() => {
              if (sessionIdRef.current !== mySession) {
                resolve("");
                return;
              }
              fetchSegmentUrl(segments[i]).then(resolve, reject);
            }, i * OPTION_PREFETCH_STAGGER_MS);
            timersRef.current.push(timer);
          });
        }

        const firstUrl = await segPromises[0];
        if (sessionIdRef.current !== mySession || !firstUrl) return;

        // Pre-fetch next question's segments 600 ms after current question starts fetching —
        // in PARALLEL so Q(n+1) is fully cached before the user advances (no inter-question gaps).
        if (nextQSegments && nextQSegments.length > 0) {
          const warmTimer = setTimeout(() => {
            if (sessionIdRef.current !== mySession) return;
            for (const nextSeg of nextQSegments) {
              void fetchSegmentUrl(nextSeg).catch(() => {});
            }
          }, 600);
          timersRef.current.push(warmTimer);
        }

        await waitIfPaused(mySession);
        if (sessionIdRef.current !== mySession) return;

        setLoading(false);
        setSpeaking(true);
        setStage(baseStage);

        await playUrl(firstUrl, mySession);

        for (let i = 1; i < segments.length; i++) {
          if (sessionIdRef.current !== mySession) return;

          // Transition clearly when moving from the question stem into options
          const isEnteringOptions =
            baseStage === "question" && i === questionSegmentCount;
          await waitNaturalPause(
            isEnteringOptions
              ? GAP_QUESTION_TO_OPTIONS_MS
              : GAP_BETWEEN_SEGMENTS_MS,
            mySession
          );
          if (sessionIdRef.current !== mySession) return;

          const nextUrl = await segPromises[i];
          if (sessionIdRef.current !== mySession || !nextUrl) return;

          if (baseStage === "question" && i >= questionSegmentCount) {
            setStage("options");
          }

          await waitIfPaused(mySession);
          if (sessionIdRef.current !== mySession) return;

          await playUrl(nextUrl, mySession);
        }

        if (sessionIdRef.current === mySession) {
          setSpeaking(false);
          setPaused(false);
          setStage("idle");
          setActiveId(null);
        }
      } catch (err) {
        if (sessionIdRef.current === mySession) {
          setLoading(false);
          setSpeaking(false);
          setPaused(false);
          setStage("idle");
          setActiveId(null);
          const msg = err instanceof Error ? err.message : "";
          if (
            msg.toLowerCase().includes("notallowed") ||
            msg.toLowerCase().includes("interact")
          ) {
            setError("Kanda akamenyetso k'ijwi kugira ngo utangire kumva");
          } else {
            setError(
              "Ntibishoboye gusoma ubu — kanda kuri akamenyetso wongere ugerageze"
            );
          }
        }
      }
    },
    [fetchSegmentUrl, playUrl, waitIfPaused, waitNaturalPause]
  );

  /**
   * Pre-fetch all segments for a question without playing them.
   * Call this on hover/focus of the "Next" button to warm the cache for Q(n+1)
   * so it starts instantly when the user advances.
   */
  const warmup = useCallback(
    (q: SpeechQuestion) => {
      if (!enabledRef.current || !audioRef.current) return;
      const { segments } = buildQuestionSpeechPlan(q);
      for (const seg of segments) {
        void fetchSegmentUrl(seg).catch(() => {});
      }
    },
    [fetchSegmentUrl]
  );

  /** Reset audio element cleanly and start a fresh playback session. */
  const beginSession = useCallback(
    (id: string | null): number | null => {
      if (!audioRef.current) return null;
      const mySession = ++sessionIdRef.current;
      clearScheduledTimers();
      pausedRef.current = false;
      setPaused(false);
      releasePauseWaiters();

      const el = audioRef.current;
      el.onended = null;
      el.onerror = null;
      el.pause();

      setError(null);
      setLoading(true);
      setSpeaking(false);
      setActiveId(id);
      return mySession;
    },
    [clearScheduledTimers, releasePauseWaiters]
  );

  /**
   * Read an exam question + all its options aloud using the single Kinyarwanda voice.
   * Accepts optional `nextQ` for seamless zero-wait prefetch after current chunks settle.
   */
  const read = useCallback(
    (q: SpeechQuestion, nextQ?: SpeechQuestion) => {
      if (!enabledRef.current || !audioRef.current) return;
      const { segments, questionSegmentCount } = buildQuestionSpeechPlan(q);
      if (segments.length === 0) return;

      const mySession = beginSession("active-question");
      if (mySession === null) return;

      const nextSegments = nextQ
        ? buildQuestionSpeechPlan(nextQ).segments
        : undefined;

      void playSegmentSequence(
        mySession,
        segments,
        questionSegmentCount,
        "question",
        nextSegments
      );
    },
    [beginSession, playSegmentSequence]
  );

  /**
   * Read any explanation, review feedback, or instruction block aloud
   * using the exact same single Kinyarwanda voice.
   */
  const readExplanation = useCallback(
    (text: string, id = "explanation") => {
      unlock();
      if (!audioRef.current) return;
      const segments = buildExplanationSpeechSegments(text);
      if (segments.length === 0) return;

      const mySession = beginSession(id);
      if (mySession === null) return;

      void playSegmentSequence(mySession, segments, segments.length, "explanation");
    },
    [beginSession, playSegmentSequence, unlock]
  );

  return {
    enabled,
    supported,
    loading,
    speaking,
    paused,
    stage,
    activeId,
    error,
    toggle,
    unlock,
    read,
    readExplanation,
    warmup,
    pause,
    resume,
    togglePause,
    stop,
  };
}
