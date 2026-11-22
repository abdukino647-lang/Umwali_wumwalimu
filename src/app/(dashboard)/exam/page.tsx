import QuizEngine from "@/components/quiz/QuizEngine";
import { BackButton } from "@/components/layout/BackButton";
import { generateRotatingExam, ExamSeenState } from "@/lib/exam-builder";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

// Always render fresh so the rotating question set differs each visit.
export const dynamic = "force-dynamic";

export default async function ExamPage() {
  // Police-exam layout: 5 Category A + 5 Category B + 5 Category C + 1 Category D + 4 Scenarios/Reactions = 20 questions
  // pulling only questions this user hasn't seen in the current loop so attempts don't repeat.
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("exam_seen_state")?.value;
  let seenState: Partial<ExamSeenState> | undefined;
  if (rawCookie) {
    try {
      seenState = JSON.parse(decodeURIComponent(rawCookie));
    } catch {}
  }

  const { questions: qList } = await generateRotatingExam(userId, seenState);

  return (
    <div className="py-8">
      <div className="mb-4">
        <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-glow text-2xl font-bold text-white">Ikizamini Rusange cy&apos;Iminota 20</h1>
        <p className="mt-1 text-sm text-cyan-100/65">
          Ibibazo 20 • Iminota 20
        </p>
      </div>
      <QuizEngine
        questions={qList as unknown as Parameters<typeof QuizEngine>[0]["questions"]}
        timeLimitSec={20 * 60}
        examMode
      />
    </div>
  );
}
