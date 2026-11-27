/**
 * patch-question-texts.ts
 *
 * Syncs the corrected Kinyarwanda question texts and options from
 * questions_grouped.json into the Neon database without wiping any
 * other columns (moduleId, examGroup, signImageUrl, etc.).
 *
 * Usage (run from project root with real DATABASE_URL in .env.local):
 *   npx tsx src/scripts/patch-question-texts.ts
 */

import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';
import data from '../data/questions_grouped.json';

type SourceOption = { key: string; text: string; isCorrect?: boolean };
type SourceQuestion = {
  number: number;
  text: string;
  options: SourceOption[];
  correctKey: string;
  [k: string]: unknown;
};

async function patch() {
  const rows = data as SourceQuestion[];
  let updated = 0;
  let skipped = 0;

  console.log(`Patching ${rows.length} questions…`);

  for (const q of rows) {
    const cleanOptions = q.options.map((o) => ({
      key: String(o.key).trim().toLowerCase(),
      text: String(o.text).trim(),
      isCorrect: Boolean(o.isCorrect),
    }));

    const result = await db
      .update(questions)
      .set({
        text: q.text,
        options: cleanOptions,
        correctKey: String(q.correctKey).trim().toLowerCase(),
      })
      .where(eq(questions.number, q.number))
      .returning({ id: questions.id });

    if (result.length > 0) {
      updated++;
    } else {
      console.warn(`  ⚠ Q#${q.number} not found in DB — skipped`);
      skipped++;
    }
  }

  console.log(`\n✅ Done. Updated: ${updated}  Skipped: ${skipped}`);
  process.exit(0);
}

patch().catch((err) => {
  console.error('Patch failed:', err);
  process.exit(1);
});
