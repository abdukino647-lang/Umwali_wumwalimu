import { questions } from "@/db/schema";
import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";
import { getModuleQuestions } from "@/lib/catalog";
import questionsGroupedData from "@/data/questions_grouped.json";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type QuestionRow = typeof questions.$inferSelect;

export default async function QuizPage({ params }: { params: Promise<{ category: string; module: string }> }) {
  const p = await params;

  // Cached per-module questions if valid UUID
  let qList: QuestionRow[] = [];
  if (UUID_PATTERN.test(p.module)) {
    qList = await getModuleQuestions(p.module);
  }

  // Fallback or virtual modules: load authoritative questions from questions_grouped.json
  if (qList.length === 0) {
    const allQuestions = questionsGroupedData;
    let pool: typeof allQuestions = [];

    if (p.module === "amategeko-mashya") {
      // Questions covering modern traffic laws & new signs (Q434 - Q453)
      pool = allQuestions.filter((q) => q.number >= 434);
    } else {
      const byCat = allQuestions.filter((q) => q.category === p.category);
      if (p.module === "ikizamini-gito") {
        pool = byCat.slice(0, 10);
      } else if (p.module.startsWith("module-")) {
        const modIdx = parseInt(p.module.replace("module-", ""), 10) || 1;
        const start = (modIdx - 1) * 20;
        pool = byCat.slice(start, start + 20);
      } else {
        // Full category or fallback
        pool = byCat.length > 0 ? byCat : allQuestions.slice(0, 20);
      }
    }

    qList = pool.map((q) => ({
      id: `q-${q.number}`,
      number: q.number,
      category: q.category as any,
      text: q.text,
      textEn: null,
      options: q.options,
      correctKey: q.correctKey,
      explanation: q.explanation || "",
      signImageUrl: (q as any).signImageUrl || (q as any).image || null,
      signSvg: (q as any).signSvg || null,
      examGroup: null,
      moduleId: p.module,
      createdAt: new Date(),
    }));
  }

  const isNewLaws = p.module === "amategeko-mashya";
  const title = isNewLaws
    ? "Ibyapa Bishya n'Amategeko Mashya (2024)"
    : `Ikizamini: ${p.category.toUpperCase()}`;

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Amasomo" fallback={`/courses/${p.category}`} />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">{title}</h1>
        <p className="text-cyan-100/65">
          {isNewLaws
            ? "Camera z'umuvuduko, 10% tolerance, BUS ONLY, Speed governors, n'ibyapa bishya • Ibibazo 20"
            : `Ibibazo ${qList.length} • Amanota fatizo 70%`}
        </p>
      </div>
      <QuizEngine questions={qList as any} moduleId={UUID_PATTERN.test(p.module) ? p.module : undefined} />
    </div>
  );
}
