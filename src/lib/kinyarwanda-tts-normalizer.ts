/**
 * kinyarwanda-tts-normalizer.ts
 *
 * Normalizes Rwanda traffic-law exam questions, answer options, and explanations
 * into pure, natural Kinyarwanda tailored for single-voice TTS pronunciation,
 * with clean sentence phrasing and natural pause punctuation.
 */

export interface SpeechQuestion {
  text: string;
  options: { key: string; text: string }[];
}

export interface SpeechSegmentsResult {
  segments: string[];
  /** Number of leading segments belonging to the question stem (before options begin). */
  questionSegmentCount: number;
}

/**
 * Pure English/French glosses that appear in parentheses after a Kinyarwanda term
 * (e.g. "abanyamagare (Piste cyclable)", "(Dépassement)") and cause mixed-language reading.
 * Stripped ONLY for speech output; UI text stays unchanged.
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
      "Fixed(?:/Static)? cameras",
      "Mobile cameras",
      "Red[- ]light cameras",
      "Piste [Cc]yclable",
      "Speed Governor",
      "Feux clignotants jaunes",
      "Zebra Crossing",
      "Rond-point",
      "Feu rouge",
      "Contrôle Technique",
      "Dépassement",
      "Travaux",
      "Sens Unique",
      "No Stopping\\s*/\\s*No Parking",
      "No Stopping",
      "No Parking",
      "Flèche Verte(?: Conditionnelle)?",
      "Arrêt de Bus",
      "Route [Gg]lissante",
      "Poids-Lourds",
      "Blood Alcohol Concentration",
      "Warning",
      "Prohibitory",
      "Mandatory",
      "Information",
      "Octogone(?: itukura)?",
      "priorité à droite",
      "snowflake/ice",
      "camion",
      "légères",
      "phares",
      "code",
      "stop",
      "signaleur",
      "verglas",
      "Ambulance",
      "police\\.gov\\.rw",
      "fines\\.police\\.gov\\.rw[^)]*",
    ].join("|") +
    ")\\)",
  "gi"
);

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

const HUNDREDS_WORDS: Record<number, string> = {
  1: "ijana",
  2: "magana abiri",
  3: "magana atatu",
  4: "magana ane",
  5: "magana atanu",
  6: "magana atandatu",
  7: "magana arindwi",
  8: "magana inani",
  9: "magana cyenda",
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

/** Speak a 0..99 integer in Kinyarwanda (Class 9 for metero/whole units, Class 8 for ibice/ibihumbi). */
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

/** Speak 0..999 integers in natural Kinyarwanda. */
function intUnder1000ToRw(n: number, class9Agree = false): string {
  if (n < 100) return intUnder100ToRw(n, class9Agree);
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const hWord = HUNDREDS_WORDS[h] ?? `${h} ijana`;
  if (rem === 0) return hWord;
  return `${hWord} na ${intUnder100ToRw(rem, class9Agree)}`;
}

/** Speak large integers (1,000 .. 999,999) in natural Kinyarwanda so Pindo never stumbles on 4-6 digit numbers. */
function largeIntToRw(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n >= 1_000_000) return String(n);
  if (n < 1000) return intUnder1000ToRw(n, false);
  const k = Math.floor(n / 1000);
  const rem = n % 1000;
  const kPart =
    k === 1 ? "igihumbi" : `ibihumbi ${intUnder1000ToRw(k, false)}`;
  if (rem === 0) return kPart;
  return `${kPart} na ${intUnder1000ToRw(rem, false)}`;
}

/**
 * Convert a decimal number like "2.50", "3.5", "0.8", "1.25", "0.30"
 * into clear Kinyarwanda words so TTS never pauses on the decimal point.
 */
function decimalToKinyarwanda(wholeStr: string, fracRaw: string): string {
  const whole = parseInt(wholeStr, 10);
  const wholeWord = whole <= 99 ? intUnder100ToRw(whole, true) : wholeStr;

  // ".5" or ".50" is universally "n'igice" ("and a half") in Kinyarwanda
  if (fracRaw === "5" || fracRaw === "50") {
    return whole === 0 ? "zeru n'igice" : `${wholeWord} n'igice`;
  }

  const fracNum = parseInt(fracRaw, 10);
  if (fracNum === 0) return wholeWord;

  const fracWord =
    fracNum <= 99 ? intUnder100ToRw(fracNum, false) : String(fracNum);
  return `${wholeWord} n'ibice ${fracWord}`;
}

/**
 * Clean & normalize any Kinyarwanda exam or explanation string into pure,
 * unambiguous, natural spoken Kinyarwanda.
 */
export function cleanForKinyarwandaSpeech(raw: string): string {
  let s = raw
    // ── 1. Normalize smart/curly apostrophes → plain ASCII so Pindo never 500s ──
    .replace(/[\u2018\u2019\u02BC\u02B9]/g, "'")
    // ── 2. Normalize vulgar fractions that Pindo can't read ──
    .replace(/½/g, "igice kimwe cya kabiri")
    .replace(/¼/g, "igice kimwe cya kane")
    .replace(/¾/g, "ibice bitatu cya kane")
    // Strip markdown headings, bold/italic markers, bullet prefixes, and diagnostic tags
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\[(?:TARGET|LAW|WRONG|CORRECT|TIP|WARN|INFO)\]\s*/g, "")
    // Specific mixed-language parenthetical phrases from the Rwanda traffic-law bank
    .replace(
      /\(\s*Boulevards\s*\/\s*Dual Carriageway[s]?(?:\s+nk'umuhanda\s+Sonatubes\s*-\s*Gahanga)?\s*\)/gi,
      ", nk'umuhanda wa Sonatubes kugera i Gahanga,"
    )
    .replace(/\(\s*tramway\s*\/\s*gari ya moshi\s*\)/gi, "")
    .replace(/\(\s*\/?\s*\)/g, "")
    .replace(FOREIGN_PAREN_GLOSSES, "")
    // Keep pure Kinyarwanda parentheticals cleanly with natural breath commas
    .replace(/\(([^)]+)\)/g, ", $1,")
    // Harmonize foreign loanwords / acronyms into natural Rwandan phonetics
    .replace(/'BUS ONLY'|"BUS ONLY"|\bBUS ONLY\b/gi, "bisi gusa")
    .replace(/\bpolice\b/gi, "polisi")
    .replace(/\btelephone\b/gi, "telefoni")
    .replace(/\bcameras?\b/gi, "kamera")
    .replace(/\bBluetooth\b/gi, "bulutufi")
    .replace(/\bcyangwa Hands-free\b/gi, "")
    .replace(/\bHands-free\b/gi, "udafata telefoni")
    .replace(/\bloud\s*speaker\b/gi, "sipika")
    .replace(/\bSMS\b/g, "esemese")
    .replace(/\bSTOP\b/g, "sitopu")
    .replace(/\bIBURYO\b/g, "iburyo")
    .replace(/\bIBUMOSO\b/g, "ibumoso")
    .replace(/\bSpeed Governor\b/gi, "akuma kagabanya umuvuduko")
    .replace(/\bPiste\s+cyclable\b/gi, "inzira y'amagare")
    .replace(/\brond-point\b/gi, "amasangano azunguruka")
    .replace(/\bcasque\b/gi, "ingofero y'abamotari")
    // Speak standalone option references inside answers clearly ("A na B" -> "A na Be")
    .replace(/\bB\b/g, "Be")
    .replace(/\bC\b/g, "Se")
    .replace(/\bD\b/g, "De")
    // Normalize quotes
    .replace(/[“”"]/g, " ");

  // Remove thousands separators inside numbers ("25,000" -> "25000", "1,000,000" -> "1000000")
  s = s.replace(/(\d),(\d{3})\b/g, "$1$2");
  s = s.replace(/(\d),(\d{3})\b/g, "$1$2");

  // Numeric ranges ("80–100 km/h", "25000–50000 Frw") -> "kugeza ku"
  s = s.replace(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g, "$1 kugeza ku $2");

  // Legal citations and dates ("No 85/01", "02/09/2002") -> pure Kinyarwanda
  s = s
    .replace(/\bNo\.?\s*(\d+)/g, "nomero $1")
    .replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, "$1 mu kwezi kwa $2 umwaka wa $3")
    .replace(/\b(\d+)\/(\d+)\b/g, "$1 kuri $2");

  // Normalize dashes to breath commas
  s = s.replace(/[–—]/g, ", ").replace(/\s+-\s+/g, ", ");

  // Comparison symbols before numbers
  s = s
    .replace(/>=\s*(\d+)/g, "guhera kuri $1")
    .replace(/<=\s*(\d+)/g, "munsi cyangwa bingana na $1")
    .replace(/>\s*(\d+)/g, "birenze $1")
    .replace(/<\s*(\d+)/g, "munsi ya $1");

  // Expand units placed BEFORE the number ("km 20", "kg 750", "m 2.50", "cm 30")
  s = s
    .replace(/\bkm\s*(\d+(?:\.\d+)?)\b/gi, "kilometero $1")
    .replace(/\bkg\s*(\d+(?:\.\d+)?)\b/gi, "ibiro $1")
    .replace(/\bm\s*(\d+(?:\.\d+)?)\b/gi, "metero $1")
    .replace(/\bcm\s*(\d+(?:\.\d+)?)\b/gi, "santimetero $1")
    .replace(/\bmm\s*(\d+(?:\.\d+)?)\b/gi, "milimetero $1");

  // Expand units placed AFTER the number
  s = s
    .replace(/(\d+(?:\.\d+)?)\s*km\/h\b/gi, "$1 kilometero ku isaha")
    .replace(/(\d+(?:\.\d+)?)\s*mg\/l\b/gi, "miligarama $1 kuri litiro")
    .replace(/(\d+(?:\.\d+)?)\s*g\/l\b/gi, "garama $1 kuri litiro")
    .replace(/(\d+(?:\.\d+)?)\s*%/g, "$1 ku ijana")
    .replace(/(\d+(?:\.\d+)?)\s*Frw\b/gi, "amafaranga $1")
    .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, "ibiro $1")
    .replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, "santimetero $1")
    .replace(/(\d+(?:\.\d+)?)\s*mm\b/gi, "milimetero $1")
    .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, "kilometero $1")
    .replace(/(\d+(?:\.\d+)?)\s*m\b/gi, "metero $1")
    .replace(/(\d+(?:\.\d+)?)\s*t\b/gi, "toni $1");

  // Convert decimals ("2.50", "3.5", "0.8") to spoken Kinyarwanda words
  s = s.replace(/\b(\d+)\.(\d+)\b/g, (_, whole, frac) =>
    decimalToKinyarwanda(whole, frac)
  );

  // Convert large integers (1,000..999,999 e.g. 3500, 25000, 100000) to Kinyarwanda words
  s = s.replace(/\b(\d{4,6})\b/g, (_, digits) =>
    largeIntToRw(parseInt(digits, 10))
  );

  // Remaining slashes between words -> "cyangwa"
  s = s.replace(/\s*\/\s*/g, " cyangwa ");

  // Collapse extra commas, newlines & whitespace cleanly
  s = s
    .replace(/\n+/g, ". ")
    .replace(/,\s*,+/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*,/g, ".")
    .replace(/\s+([.,?!;:])/g, "$1")
    .replace(/([.,?!;:])([^\s])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

/**
 * Phonetically unambiguous Kinyarwanda option letters.
 * "Hitamo." is spoken ONCE after the question, then each option is introduced
 * with just its letter abbreviation: "A, [text]. Be, [text]. Se, [text]. De, [text]."
 * This is the professional radio/announcer style and avoids repetitive "Hitamo rya".
 */
const RW_OPTION_LETTERS: Record<string, string> = {
  a: "A",
  b: "Be",
  c: "Se",
  d: "De",
};

/** Split a long text block into <= maxLen chunks cleanly along sentence/clause boundaries. */
export function splitLongChunk(text: string, maxLen = 200): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let rest = text;

  while (rest.length > maxLen) {
    const slice = rest.slice(0, maxLen);
    let cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("; "),
      slice.lastIndexOf(": "),
      slice.lastIndexOf(", ")
    );
    if (cut < Math.floor(maxLen * 0.35)) {
      cut = slice.lastIndexOf(" ");
    }
    if (cut < 20) cut = maxLen;
    else cut += 1;
    const head = rest.slice(0, cut).trim();
    if (head) parts.push(head);
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/**
 * Turn a quiz question + its options into clean, natural speech segments
 * plus the exact boundary index where the question ends and options begin.
 *
 * Option format (professional, concise):
 *   "Hitamo. A, [text]. Be, [text]. Se, [text]. De, [text]."
 * — "Hitamo." is spoken ONCE, then each letter+text in one flowing sentence.
 * — All 4 options are packed into ONE Pindo API call when total ≤ 380 chars.
 *   If longer, the first pair gets "Hitamo. A, ... Be, ..." and the second
 *   pair "Se, ... De, ..." — still far fewer API calls than the old per-option format.
 */
export function buildQuestionSpeechPlan(
  q: SpeechQuestion
): SpeechSegmentsResult {
  const cleanQ = cleanForKinyarwandaSpeech(q.text);
  const qSegments = splitLongChunk(cleanQ, 200).filter(Boolean);

  // Build each option line as "Letter, text."
  const optLines = q.options.map((opt) => {
    const k = opt.key.toLowerCase();
    const letter = RW_OPTION_LETTERS[k] ?? k.toUpperCase();
    const cleanOpt = cleanForKinyarwandaSpeech(opt.text).replace(/[.?]+$/, "");
    return `${letter}, ${cleanOpt}.`;
  });

  // Try packing all 4 options into ONE segment with a single "Hitamo." intro.
  const allOptsText = `Hitamo. ${optLines.join(" ")}`;
  let optionSegments: string[];

  if (allOptsText.length <= 380) {
    // Best case: entire options block is one seamless API call.
    optionSegments = [allOptsText];
  } else {
    // Split: first segment = "Hitamo. A, ... Be, ..."
    //        second segment = "Se, ... De, ..."
    const ab = `Hitamo. ${optLines.slice(0, 2).join(" ")}`;
    const cd = optLines.slice(2).join(" ");
    if (ab.length <= 380 && cd.length <= 380) {
      optionSegments = [ab, cd];
    } else {
      // Edge case: individual option text is extremely long — split further.
      optionSegments = [
        ...splitLongChunk(ab, 380),
        ...splitLongChunk(cd, 380),
      ];
    }
  }

  const cleanOptions = optionSegments.filter(Boolean);

  // When the stem is too short (<45 chars), Pindo voice-conditioning ignores the reference
  // audio clip — not enough phonetic content to anchor the voice (outputs F0 ~250 Hz instead
  // of the target ~200 Hz). Fix: fuse the stem into the first options segment so the combined
  // text is long enough to condition the voice properly. Affects all "Iki cyapa kivuga:" etc.
  const SHORT_STEM_THRESHOLD = 45;
  if (
    qSegments.length === 1 &&
    cleanQ.length < SHORT_STEM_THRESHOLD &&
    cleanOptions.length > 0
  ) {
    const fusedStem = cleanQ.replace(/:$/, ".");
    cleanOptions[0] = `${fusedStem} ${cleanOptions[0]}`;
    return {
      segments: cleanOptions,
      questionSegmentCount: 0,
    };
  }

  return {
    segments: [...qSegments, ...cleanOptions],
    questionSegmentCount: qSegments.length,
  };
}

/** Backward-compatible helper returning flat segment list for a question. */
export function buildQuestionSpeechSegments(q: SpeechQuestion): string[] {
  return buildQuestionSpeechPlan(q).segments;
}

/** Normalize an explanation/instruction markdown block into natural Kinyarwanda speech chunks. */
export function buildExplanationSpeechSegments(text: string): string[] {
  const clean = cleanForKinyarwandaSpeech(text);
  if (!clean) return [];
  return splitLongChunk(clean, 200).filter(Boolean);
}
