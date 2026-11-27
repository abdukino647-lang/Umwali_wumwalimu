/**
 * useSpeaker — Kinyarwanda Text-to-Speech hook for the exam engine.
 *
 * Uses the browser's built-in Web Speech API (SpeechSynthesis).
 * Prefers a Kinyarwanda voice (rw / rw-RW) if the device has one,
 * otherwise falls back to French (fr-FR) whose phonetics are very close to Kinyarwanda,
 * then to any available voice.
 *
 * Reading order per question:
 *   1. Question text
 *   2. "A: <option a>"  "B: <option b>"  "C: <option c>"  "D: <option d>"
 *
 * Speed is set fast (rate 1.35) so the full reading fits comfortably inside 30 s,
 * leaving the user maximum time to think before the 60-second timer expires.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeakerQuestion {
  text: string;
  options: { key: string; text: string }[];
}

/** Strips markdown-style bold markers (**…**) and bracket tags ([TAG]) from TTS text. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")           // remove **bold**
    .replace(/\[(?:TARGET|LAW|WRONG|CORRECT|TIP|WARN|INFO)\]\s*/g, "") // remove [MARKER]
    .replace(/\s+/g, " ")
    .trim();
}

/** Option key letter → Kinyarwanda letter name for natural reading. */
const KEY_LABEL: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
};

export function useSpeaker() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("exam_speaker") === "1";
  });
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Detect support and pick the best voice.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    synthRef.current = window.speechSynthesis;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      // Priority 1: any voice whose lang starts with "rw"
      let v = voices.find((v) => v.lang.toLowerCase().startsWith("rw"));
      // Priority 2: French (closest phonetics for Kinyarwanda)
      if (!v) v = voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
      // Priority 3: English fallback
      if (!v) v = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
      // Priority 4: whatever exists
      if (!v) v = voices[0];
      voiceRef.current = v ?? null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
    };
  }, []);

  // Persist preference.
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

  /** Stop any ongoing speech immediately. */
  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  /**
   * Read a question aloud: question text, then each option.
   * Existing speech is cancelled before starting.
   */
  const read = useCallback(
    (q: SpeakerQuestion) => {
      if (!enabled || !synthRef.current) return;
      synthRef.current.cancel();

      const synth = synthRef.current;

      // Build utterance list: question + options.
      const segments: string[] = [
        cleanForSpeech(q.text),
        ...q.options.map(
          (opt) => `${KEY_LABEL[opt.key] ?? opt.key.toUpperCase()}: ${cleanForSpeech(opt.text)}`
        ),
      ];

      let segIdx = 0;

      const speakNext = () => {
        if (segIdx >= segments.length) {
          setSpeaking(false);
          return;
        }
        const utt = new SpeechSynthesisUtterance(segments[segIdx]);
        utt.rate = 1.35;   // fast — leaves ample thinking time
        utt.pitch = 1.0;
        utt.volume = 1.0;
        if (voiceRef.current) utt.voice = voiceRef.current;

        // Kinyarwanda lang tag; browser falls back gracefully if unsupported.
        utt.lang = voiceRef.current?.lang ?? "rw-RW";

        utt.onend = () => {
          segIdx++;
          speakNext();
        };
        utt.onerror = () => {
          setSpeaking(false);
        };

        synth.speak(utt);
        if (segIdx === 0) setSpeaking(true);
        segIdx++;
        // speakNext will be triggered by onend — reset segIdx accounting.
      };

      // Fix: use onend chain properly.
      const speakAll = () => {
        setSpeaking(true);
        const utterances = segments.map((text) => {
          const utt = new SpeechSynthesisUtterance(text);
          utt.rate = 1.35;
          utt.pitch = 1.0;
          utt.volume = 1.0;
          if (voiceRef.current) utt.voice = voiceRef.current;
          utt.lang = voiceRef.current?.lang ?? "rw-RW";
          return utt;
        });

        utterances.forEach((utt, i) => {
          utt.onend = () => {
            if (i === utterances.length - 1) setSpeaking(false);
          };
          utt.onerror = () => setSpeaking(false);
          synth.speak(utt);
        });
      };

      speakAll();
      void speakNext; // suppress unused warning
    },
    [enabled]
  );

  return { enabled, supported, speaking, toggle, read, stop };
}
