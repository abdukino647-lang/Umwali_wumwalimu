/**
 * useSpeaker — Kinyarwanda-only Text-to-Speech hook for the exam engine.
 *
 * Uses the browser Web Speech API (SpeechSynthesis).
 *
 * Language is ALWAYS set to "rw-RW" (Kinyarwanda).
 * No French / English fallback — Kinyarwanda only.
 *
 * Voice selection:
 *   1. Any voice whose lang starts with "rw"  (native Kinyarwanda voice on Android/Google TTS)
 *   2. No explicit voice — let the browser use whatever engine it has,
 *      but the utterance lang="rw-RW" tells it to pronounce in Kinyarwanda.
 *
 * Reading order per question:
 *   1. Question text
 *   2. "A: <option a>", "B: <option b>", "C: <option c>", "D: <option d>"
 *
 * Rate 1.3× — fast enough to finish reading within ~25 s, leaving the user
 * maximum thinking time inside the 60-second per-question timer.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeakerQuestion {
  text: string;
  options: { key: string; text: string }[];
}

/** Remove markdown bold (**…**) and [MARKER] tags before speaking. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(?:TARGET|LAW|WRONG|CORRECT|TIP|WARN|INFO)\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Option letter labels as spoken in Kinyarwanda. */
const KEY_LABEL: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };

/** Build a Kinyarwanda utterance — lang is ALWAYS rw-RW, no fallback. */
function makeUtterance(
  text: string,
  rwVoice: SpeechSynthesisVoice | null
): SpeechSynthesisUtterance {
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "rw-RW";           // Kinyarwanda — always, no exception
  utt.rate = 1.3;
  utt.pitch = 1.0;
  utt.volume = 1.0;
  // Only assign a voice object if we actually found a rw voice;
  // otherwise leave it unset so the engine uses lang="rw-RW" to pick one.
  if (rwVoice) utt.voice = rwVoice;
  return utt;
}

export function useSpeaker() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("exam_speaker") === "1";
  });
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  /** Kinyarwanda voice if the device has one; null otherwise (lang tag still applied). */
  const rwVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  /* ── Boot: detect support, find rw voice ───────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    synthRef.current = window.speechSynthesis;

    const pickRwVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Strictly prefer any voice tagged rw / rw-RW; don't fall back.
      const rw = voices.find((v) => v.lang.toLowerCase().startsWith("rw"));
      rwVoiceRef.current = rw ?? null;
    };

    pickRwVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickRwVoice);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", pickRwVoice);
  }, []);

  /* ── Toggle (persist to localStorage) ──────────────────────────────────── */
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("exam_speaker", next ? "1" : "0");
      }
      if (!next) {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
      }
      return next;
    });
  }, []);

  /* ── Stop ───────────────────────────────────────────────────────────────── */
  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  /* ── Read a question (text + all options) in Kinyarwanda ───────────────── */
  const read = useCallback(
    (q: SpeakerQuestion) => {
      if (!enabled || !synthRef.current) return;

      const synth = synthRef.current;
      synth.cancel(); // stop any previous reading

      // Build segments: question text first, then each option.
      const segments = [
        cleanForSpeech(q.text),
        ...q.options.map(
          (opt) =>
            `${KEY_LABEL[opt.key] ?? opt.key.toUpperCase()}: ${cleanForSpeech(opt.text)}`
        ),
      ];

      // Queue all utterances — the browser plays them one by one.
      setSpeaking(true);
      segments.forEach((text, i) => {
        const utt = makeUtterance(text, rwVoiceRef.current);
        utt.onend = () => {
          if (i === segments.length - 1) setSpeaking(false);
        };
        utt.onerror = () => setSpeaking(false);
        synth.speak(utt);
      });
    },
    [enabled]
  );

  return { enabled, supported, speaking, toggle, read, stop };
}
