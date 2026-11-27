import { db } from "@/db";
import { questions, examSeen } from "@/db/schema";
import { eq } from "drizzle-orm";
import questionsGroupedData from "@/data/questions_grouped.json";

export type Q = typeof questions.$inferSelect;

export type ExamSeenState = {
  a: number[];
  b: number[];
  c: number[];
  d: number[];
  s: number[];
};

type RawQuestion = {
  number: number;
  text: string;
  options: { key: string; text: string; isCorrect?: boolean }[];
  correctKey: string;
  category?: string;
  explanation?: string;
  image?: string;
  signImageUrl?: string;
  signSvg?: string;
  _uniqueNumber?: number;
};

// Common situational triggers in the driving theory book (scenarios / reactions)
const SCENARIO_TRIGGERS = [
  "wakora iki", "yakora iki", "wakwitwara", "yakwitwara", "myitwarire",
  "myifatire", "ugomba gukora", "akwiriye gukora", "akwiye gukora",
  "uhuye n", "iyo uhuye", "ugeze", "ageze", "ubonye", "yegereye",
  "akurikiye", "ashaka gukatira", "aritegura", "ndashaka", "mfite uburenganzira",
  "ninde ufite uburenganzira", "gutambuka mbere", "gutambuka imbere",
  "kugata ibumoso", "kugata iburyo", "gukata ibumoso", "gukata iburyo", "gukatira ibumoso", "gukatira iburyo",
  "kunyuraho", "kunyuranaho", "guha inzira", "gutanga inzira"
];

const NUMERIC_PATTERN = /\d+\s*(?:km\/h|km|m\b|cm|toni|kg|%|°|isaha|amasaha|amezi|umwaka)/i;

// Prepare authoritative questions with guaranteed unique numbers
const preparedQuestions: (RawQuestion & { _uniqueNumber: number })[] = (() => {
  const seenNumbers = new Set<number>();
  return (questionsGroupedData as RawQuestion[]).map((raw) => {
    let num = raw.number;
    while (seenNumbers.has(num)) {
      num += 1000;
    }
    seenNumbers.add(num);
    return {
      ...raw,
      _uniqueNumber: num,
    };
  });
})();

// Classification into the 5 mutually-exclusive pools:
const isPoolD = (q: RawQuestion) => q.number >= 434;

const isPoolS = (q: RawQuestion) => {
  if (isPoolD(q)) return false;
  const t = (q.text || "").toLowerCase().trim();
  if (SCENARIO_TRIGGERS.some((tr) => t.includes(tr))) return true;
  if (q.signImageUrl || q.image) {
    if (t.includes("ikinyabiziga") || t.includes("imodoka") || t.includes("sangano") || t.includes("kimenyetso kiri mu muhanda")) {
      return true;
    }
  }
  return false;
};

const isPoolB = (q: RawQuestion) => {
  if (isPoolD(q) || isPoolS(q)) return false;
  if (q.category === "numeric") return true;
  const hay = `${q.text || ""} ${(q.options || []).map((o) => o.text).join(" ")}`;
  return NUMERIC_PATTERN.test(hay) && !(q.signImageUrl || q.image);
};

const isPoolC = (q: RawQuestion) => {
  if (isPoolD(q) || isPoolS(q) || isPoolB(q)) return false;
  return q.category === "ibyapa" || Boolean(q.signImageUrl || q.image);
};

const isPoolA = (q: RawQuestion) => {
  return !isPoolD(q) && !isPoolS(q) && !isPoolB(q) && !isPoolC(q);
};

const POOL_ITEMS = {
  a: preparedQuestions.filter(isPoolA),
  b: preparedQuestions.filter(isPoolB),
  c: preparedQuestions.filter(isPoolC),
  d: preparedQuestions.filter(isPoolD),
  s: preparedQuestions.filter(isPoolS),
};

// Target composition per 20-question exam:
// Category A (5) + Category B (5) + Category C (5) + Category D (1) + Scenarios (4) = 20
export const POOL_TARGETS = {
  a: 5,
  b: 5,
  c: 5,
  d: 1,
  s: 4,
} as const;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Pick `count` questions from `pool` avoiding questions present in `seenSet`.
 * When unseen pool is exhausted, it resets `seenSet` (completing a loop)
 * and continues smoothly picking from the refreshed pool without dropping any questions.
 */
function pickFromPool(
  pool: (RawQuestion & { _uniqueNumber: number })[],
  count: number,
  seenSet: Set<number>
): (RawQuestion & { _uniqueNumber: number })[] {
  const chosen: (RawQuestion & { _uniqueNumber: number })[] = [];
  const available = pool.filter((q) => !seenSet.has(q._uniqueNumber));

  if (available.length < count) {
    // Take whatever remains in current cycle
    const shuffledAvail = shuffle(available);
    chosen.push(...shuffledAvail);
    shuffledAvail.forEach((q) => seenSet.add(q._uniqueNumber));

    // Cycle completed for this pool -> reset seen
    seenSet.clear();

    // Pick remainder from fresh pool excluding already chosen
    const needed = count - chosen.length;
    const freshAvailable = pool.filter((q) => !chosen.some((c) => c._uniqueNumber === q._uniqueNumber));
    const freshShuffled = shuffle(freshAvailable).slice(0, needed);
    chosen.push(...freshShuffled);
    freshShuffled.forEach((q) => seenSet.add(q._uniqueNumber));
  } else {
    const picked = shuffle(available).slice(0, count);
    chosen.push(...picked);
    picked.forEach((q) => seenSet.add(q._uniqueNumber));
  }

  return chosen;
}

/**
 * Generate a 20-question rotating exam that:
 * 1. Has exact distribution: 5 Category A, 5 Category B, 5 Category C, 1 Category D, 4 Scenarios.
 * 2. Avoids repetition across attempts by tracking seen questions.
 * 3. Loops through all questions in each pool and resets when a pool completes its cycle.
 * 4. Interleaves / mixes the 20 questions so they aren't rigid blocks.
 */
export async function generateRotatingExam(
  userId?: string,
  incomingSeenState?: Partial<ExamSeenState>
): Promise<{ questions: Q[]; seenState: ExamSeenState }> {
  const seenSets = {
    a: new Set<number>(incomingSeenState?.a || []),
    b: new Set<number>(incomingSeenState?.b || []),
    c: new Set<number>(incomingSeenState?.c || []),
    d: new Set<number>(incomingSeenState?.d || []),
    s: new Set<number>(incomingSeenState?.s || []),
  };

  // If user is logged in, optionally merge seen questions from database `examSeen`
  if (userId) {
    try {
      const seenRows = await db
        .select({ questionId: examSeen.questionId })
        .from(examSeen)
        .where(eq(examSeen.userId, userId));

      if (seenRows.length > 0) {
        const seenIds = new Set(seenRows.map((r) => r.questionId));
        // Match against DB question numbers
        const dbQs = await db.select({ id: questions.id, number: questions.number }).from(questions);
        for (const dq of dbQs) {
          if (seenIds.has(dq.id)) {
            // Find which pool this number belongs to and mark it
            for (const key of ["a", "b", "c", "d", "s"] as const) {
              if (POOL_ITEMS[key].some((q) => q.number === dq.number)) {
                seenSets[key].add(dq.number);
                break;
              }
            }
          }
        }
      }
    } catch {
      // Non-blocking: database read failure falls back to cookie/in-memory state
    }
  }

  // Try fetching DB question IDs to preserve UUIDs for quiz attempt answers
  let dbIdByNumber = new Map<number, string>();
  try {
    const dbRows = await db.select({ id: questions.id, number: questions.number }).from(questions);
    dbIdByNumber = new Map(dbRows.map((r) => [r.number, r.id]));
  } catch {
    // Non-blocking
  }

  const selectedRaw: (RawQuestion & { _uniqueNumber: number; poolKey: string })[] = [];

  for (const key of ["a", "b", "c", "d", "s"] as const) {
    const targetCount = POOL_TARGETS[key];
    const picked = pickFromPool(POOL_ITEMS[key], targetCount, seenSets[key]);
    picked.forEach((q) => selectedRaw.push({ ...q, poolKey: key }));
  }

  // Mix all 20 chosen questions together
  const mixed = shuffle(selectedRaw);

  const formattedQuestions: Q[] = mixed.map((q) => {
    const cat = (q.category === "numeric" || q.category === "ibyapa" ? q.category : "text") as "text" | "numeric" | "ibyapa";
    const realDbId = dbIdByNumber.get(q.number);

    return {
      id: realDbId || `q-${q._uniqueNumber}`,
      number: q.number,
      category: cat,
      text: q.text,
      textEn: null,
      options: q.options,
      correctKey: q.correctKey,
      explanation: q.explanation || `Igisubizo cy'ukuri ni ${String(q.correctKey).toUpperCase()}`,
      signImageUrl: q.signImageUrl || q.image || null,
      signSvg: null,
      examGroup: q.poolKey,
      moduleId: null,
      createdAt: new Date(),
    };
  });

  const updatedSeenState: ExamSeenState = {
    a: Array.from(seenSets.a),
    b: Array.from(seenSets.b),
    c: Array.from(seenSets.c),
    d: Array.from(seenSets.d),
    s: Array.from(seenSets.s),
  };

  return {
    questions: formattedQuestions,
    seenState: updatedSeenState,
  };
}

/**
 * Backward-compatible helper for server components
 */
export async function buildRotatingExam(
  userId?: string,
  seenState?: Partial<ExamSeenState>
): Promise<Q[]> {
  const result = await generateRotatingExam(userId, seenState);
  return result.questions;
}
