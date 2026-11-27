/**
 * kinyarwanda-tts-normalizer.ts
 *
 * Normalizes Rwanda traffic-law exam text into pure, natural Kinyarwanda
 * tailored for Kinyarwanda TTS pronunciation, and splits questions + options
 * into fast, low-latency speech segments.
 */

export interface SpeechQuestion {
  text: string;
  options: { key: string; text: string }[];
}

/**
 * Pure English/French glosses that appear in parentheses after a Kinyarwanda term
 * (e.g. "abanyamagare (Piste cyclable)") and cause mixed-language reading.
 * These are stripped ONLY for audio reading; UI display stays unchanged.
 */
const FOREIGN_PAREN_GLOSSES = new RegExp(
  "\\s*\\((" +
    [
      "circle",
      "triangle",
      "rectangle",
      "diamond(?:/square rotated 45 degrees)?",
      "tram",
      "casque",
      "Speed Enforcement Cameras",
      "Fixed/Static cameras",
      "Mobile cameras",
      "Red light cameras",
      "Piste cyclable",
      "Speed Governor",
      "Feux clignotants jaunes",
      "Zebra Crossing",
      "Rond-point",
      "Feu rouge",
    ].join("|") +
    ")\\)",
  "gi"
);

/** Convert common integers (0..999) into natural Kinyarwanda words for decimals/units. */
const ONES_CLASS9: Record<number, string> = {
  0: "zeru",
  1: "imwe",
  2: "ebiri",
  3: "eshatu",
  4: "enye",
  5: "eshanu",
  6: "esheshatu",
  7: "indwi",
  8: "umunani",
  9: "icyenda",
};

const ONES_CLASS8: Record<number, string> = {
  0: "zeru",
  1: "kimwe",
  2: "bibiri",
  3: "bitatu",
  4: "bine",
  5: "bitanu",
  6: "bitandatu",
  7: "birindwi",
  8: "umunani",
  9: "icyenda",
};

const TENS: Record<number, string> = {
  10: "icumi",
  20: "makumyabiri",
  30: "mirongo itatu",
  40: "mirongo ine",
  50: "mirongo itanu",
  60: "mirongo itandatu",
  70: "mirongo irindwi",
  80: "mirongo inani",
  90: "mirongo cyenda",
};

/** Speak a 0..99 integer in Kinyarwanda (Class 9 for metero/whole units, Class 8 for ibice/fractional parts). */
function intUnder100ToRw(n: number, class9Agree = false): string {
  const ones = class9Agree ? ONES_CLASS9 : ONES_CLASS8;
  if (n < 10) return ones[n] ?? String(n);
  if (n % 10 === 0 && TENS[n]) return TENS[n];
  if (n < 20) {
    const unit = n - 10;
    const conj = [1, 2, 3, 4, 5, 6, 7].includes(unit) ? "na " : "n'";
    return `icumi ${conj}${ones[unit]}`;
  }
  const tenBase = Math.floor(n / 10) * 10;
  const unit = n % 10;
  const tenWord = TENS[tenBase];
  if (!tenWord) return String(n);
  return `${tenWord} na ${ones[unit]}`;
}

/**
 * Convert a decimal number like "2.50", "3.5", "0.8", "1.25", "0.30"
 * into clear Kinyarwanda words so the TTS engine never says "point" or pauses on the dot.
 */
function decimalToKinyarwanda(wholeStr: string, fracRaw: string): string {
  const whole = parseInt(wholeStr, 10);
  const wholeWord = whole <= 99 ? intUnder100ToRw(whole, true) : wholeStr;

  // ".5" or ".50" is universally "n'igice" ("and a half") in Kinyarwanda
  if (fracRaw === "5" || fracRaw === "50") {
    return whole === 0 ? "zeru n'igice" : `${wholeWord} n'igice`;
  }

  // Strip trailing zero if 2-digit e.g. "30" -> keep numeric 30 vs "0.8" -> 8
  const fracNum = parseInt(fracRaw, 10);
  if (fracNum === 0) return wholeWord;

  const fracWord =
    fracNum <= 99 ? intUnder100ToRw(fracNum, false) : String(fracNum);
  return `${wholeWord} n'ibice ${fracWord}`;
}

/**
 * Clean & normalize any Kinyarwanda exam string into pure pronounceable Kinyarwanda.
 */
export function cleanForKinyarwandaSpeech(raw: string): string {
  let s = raw
    // Strip markdown bold and diagnostic markers
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(?:TARGET|LAW|WRONG|CORRECT|TIP|WARN|INFO)\]\s*/g, "")
    // Specific mixed-language parenthetical phrases from the Rwanda traffic-law bank
    .replace(
      /\(\s*Boulevards\s*\/\s*Dual Carriageway\s+nk'umuhanda\s+Sonatubes\s*-\s*Gahanga\s*\)/gi,
      ", nk'umuhanda wa Sonatubes kugera i Gahanga,"
    )
    .replace(/\(\s*tramway\s*\/\s*gari ya moshi\s*\)/gi, "")
    .replace(FOREIGN_PAREN_GLOSSES, "")
    // Keep pure Kinyarwanda parentheticals cleanly without brackets
    .replace(/\(([^)]+)\)/g, ", $1,")
    // Harmonize foreign loan spellings into Rwandan Kinyarwanda phonetic forms
    .replace(/'BUS ONLY'|"BUS ONLY"|\bBUS ONLY\b/gi, "bisi gusa")
    .replace(/\bpolice\b/gi, "polisi")
    .replace(/\btelephone\b/gi, "telefoni")
    .replace(/\bcameras?\b/gi, "kamera")
    .replace(/\bBluetooth\b/gi, "bulutufi")
    .replace(/\bcyangwa Hands-free\b/gi, "")
    .replace(/\bHands-free\b/gi, "udafata telefoni")
    .replace(/\bloud\s*speaker\b/gi, "sipika")
    .replace(/\bSMS\b/g, "esemese")
    // Speak standalone option references inside answers clearly ("A na B" -> "A na Be")
    .replace(/\bB\b/g, "Be")
    .replace(/\bC\b/g, "Se")
    .replace(/\bD\b/g, "De")
    // Normalize curly quotes and dashes
    .replace(/[“”"]/g, " ")
    .replace(/[–—]/g, ", ")
    .replace(/\s+-\s+/g, ", ");

  // Remove thousands separators inside numbers: "25,000" -> "25000"
  s = s.replace(/(\d),(\d{3})\b/g, "$1$2");
  // Run twice for >= 1,000,000
  s = s.replace(/(\d),(\d{3})\b/g, "$1$2");

  // Expand units placed BEFORE the number ("m 2.50", "m2.70", "m 200", "cm 30")
  s = s
    .replace(/\bm\s*(\d+(?:\.\d+)?)\b/gi, "metero $1")
    .replace(/\bcm\s*(\d+(?:\.\d+)?)\b/gi, "santimetero $1")
    .replace(/\bmm\s*(\d+(?:\.\d+)?)\b/gi, "milimetero $1");

  // Expand units placed AFTER the number
  s = s
    .replace(/(\d+(?:\.\d+)?)\s*km\/h\b/gi, "$1 kilometero ku isaha")
    .replace(/(\d+(?:\.\d+)?)\s*g\/l\b/gi, "garama $1 kuri litiro")
    .replace(/(\d+(?:\.\d+)?)\s*%/g, "$1 ku ijana")
    .replace(/(\d+(?:\.\d+)?)\s*Frw\b/gi, "amafaranga $1")
    .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, "ibiro $1")
    .replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, "santimetero $1")
    .replace(/(\d+(?:\.\d+)?)\s*mm\b/gi, "milimetero $1")
    .replace(/(\d+(?:\.\d+)?)\s*m\b/gi, "metero $1")
    .replace(/(\d+(?:\.\d+)?)\s*t\b/gi, "toni $1");

  // Convert decimals ("2.50", "3.5", "0.8") to spoken Kinyarwanda words
  s = s.replace(/\b(\d+)\.(\d+)\b/g, (_, whole, frac) =>
    decimalToKinyarwanda(whole, frac)
  );

  // Remaining slashes between words (e.g. "a / b") -> "cyangwa"
  s = s.replace(/\s*\/\s*/g, " cyangwa ");

  // Collapse extra commas & whitespace
  s = s
    .replace(/,\s*,+/g, ",")
    .replace(/\s+([.,?!;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

/** Phonetically unambiguous Kinyarwanda letter names for option keys a, b, c, d. */
const RW_OPTION_PREFIX: Record<string, string> = {
  a: "Hitamo A",
  b: "Hitamo Be",
  c: "Hitamo Se",
  d: "Hitamo De",
};

/** Split a long single text block into <= maxLen chunks cleanly along punctuation or spaces. */
function splitLongChunk(text: string, maxLen = 210): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let rest = text;

  while (rest.length > maxLen) {
    const slice = rest.slice(0, maxLen);
    // Prefer sentence or clause boundary past 40% of maxLen
    let cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("; "),
      slice.lastIndexOf(", ")
    );
    if (cut < Math.floor(maxLen * 0.4)) {
      cut = slice.lastIndexOf(" ");
    }
    if (cut < 20) cut = maxLen;
    else cut += 1; // keep punctuation/space cleanly before trimming
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/**
 * Turn a quiz question + its options into 2–5 short, crisp speech segments.
 * Keeping each segment ~80–210 chars gives fast ~2s TTFB on the first segment
 * while options fetch and buffer in parallel while the question is spoken.
 */
export function buildQuestionSpeechSegments(q: SpeechQuestion): string[] {
  const cleanQ = cleanForKinyarwandaSpeech(q.text);
  const qSegments = splitLongChunk(cleanQ, 210);

  const optionLines = q.options.map((opt) => {
    const k = opt.key.toLowerCase();
    const prefix = RW_OPTION_PREFIX[k] ?? `Hitamo ${k.toUpperCase()}`;
    const cleanOpt = cleanForKinyarwandaSpeech(opt.text).replace(/[.?]+$/, "");
    return `${prefix}, ${cleanOpt}.`;
  });

  // Group options pairwise (A+B, C+D) when concise so we minimize API roundtrips;
  // automatically split any oversized pair so each chunk stays <= 220 chars.
  const optionSegments: string[] = [];
  for (let i = 0; i < optionLines.length; i += 2) {
    const first = optionLines[i];
    const second = optionLines[i + 1];
    if (second && first.length + 1 + second.length <= 220) {
      optionSegments.push(`${first} ${second}`);
    } else {
      optionSegments.push(...splitLongChunk(first, 220));
      if (second) optionSegments.push(...splitLongChunk(second, 220));
    }
  }

  return [...qSegments, ...optionSegments].filter(Boolean);
}
