/**
 * patch-question-texts.ts
 *
 * Syncs the corrected Kinyarwanda question texts and options from
 * questions_grouped.json into the Neon database without wiping any
 * other columns (moduleId, examGroup, signImageUrl, etc.).
 *
 * Automatically reads DATABASE_URL from .env.local when present.
 *
 * Usage:
 *   npx tsx src/scripts/patch-question-texts.ts
 */

import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import data from '../data/questions_grouped.json';

function loadEnvLocalIfMissing() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

type SourceOption = { key: string; text: string; isCorrect?: boolean };
type SourceQuestion = {
  number: number;
  text: string;
  options: SourceOption[];
  correctKey: string;
  [k: string]: unknown;
};

async function patch() {
  loadEnvLocalIfMissing();
  const [{ db }, { questions }] = await Promise.all([
    import('../db'),
    import('../db/schema'),
  ]);
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
