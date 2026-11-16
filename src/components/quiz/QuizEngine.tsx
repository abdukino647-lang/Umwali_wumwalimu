"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuizQuestion, calculateScore, getCorrectKey } from "@/lib/quiz-engine";
import {
  CheckCircle2,
  XCircle,
  Bot,
  Lightbulb,
  X,
  Trophy,
  Timer,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedExplanation({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-cyan-50">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={i} className="text-base font-bold text-amber-300">
              {trimmed.replace("### ", "")}
            </h4>
          );
        }
        if (trimmed.startsWith("#### ")) {
          return (
            <h5 key={i} className="mt-2 text-sm font-semibold text-cyan-200">
              {trimmed.replace("#### ", "")}
            </h5>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              <div>{renderFormattedText(trimmed.slice(2))}</div>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="font-semibold text-cyan-300">{numMatch[1]}.</span>
              <div>{renderFormattedText(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={i}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
}

export default function QuizEngine({
  questions,
  moduleId,
  timeLimitSec,
  examMode,
}: {
  questions: QuizQuestion[];
  moduleId?: string;
  timeLimitSec?: number;
  examMode?: boolean;
}) {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [scoreData, setScoreData] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [openExplanationIds, setOpenExplanationIds] = useState<Record<string, boolean>>({});
  const [loadingExplanationId, setLoadingExplanationId] = useState<string | null>(null);
  const [loadingNextExam, setLoadingNextExam] = useState(false);
  const [remaining, setRemaining] = useState(timeLimitSec ?? 0);

  useEffect(() => {
    setActiveQuestions(questions);
    setRemaining(timeLimitSec ?? 0);
  }, [questions, timeLimitSec]);

  const fetchExplanation = async (quizQ: QuizQuestion, correctAnswerKey: string, userAnswer?: string) => {
    const qId = quizQ.id;
    const willOpen = !openExplanationIds[qId];
    setOpenExplanationIds((prev) => ({ ...prev, [qId]: willOpen }));

    if (!willOpen || explanations[qId]) return;

    setLoadingExplanationId(qId);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: quizQ.id,
          questionNumber: quizQ.number,
          questionText: quizQ.text,
          category: quizQ.category,
          options: quizQ.options,
          correctKey: correctAnswerKey,
          correctText: quizQ.options.find((o) => o.key === correctAnswerKey)?.text || "",
          userKey: userAnswer || null,
          userText: quizQ.options.find((o) => o.key === userAnswer)?.text || "",
        }),
      });
      const data = await res.json();
      if (data?.explanation) {
        setExplanations((prev) => ({ ...prev, [qId]: data.explanation }));
      }
    } catch (e) {
      console.error("Failed to load explanation:", e);
    } finally {
      setLoadingExplanationId(null);
    }
  };

  const q = activeQuestions[currentIdx];

  // Refs so the countdown's auto-submit always reads the latest answers / runs once.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const current = answersRef.current;
    const correctKeys: Record<string, string> = {};
    activeQuestions.forEach((question) => {
      correctKeys[question.id] = getCorrectKey(question);
    });
    const result = calculateScore(current, activeQuestions, correctKeys);
    setScoreData(result);
    setShowResult(true);

    // Save seen questions into cookie for rotating exams to prevent repetition
    if (examMode && typeof document !== "undefined") {
      try {
        const cookieMatch = document.cookie.match(/exam_seen_state=([^;]+)/);
        let existingSeen: Record<string, number[]> = { a: [], b: [], c: [], d: [], s: [] };
        if (cookieMatch) {
          try {
            existingSeen = { ...existingSeen, ...JSON.parse(decodeURIComponent(cookieMatch[1])) };
          } catch {}
        }
        activeQuestions.forEach((qq) => {
          const poolKey = ((qq as any).examGroup || (qq.number >= 434 ? "d" : qq.category === "numeric" ? "b" : qq.category === "ibyapa" ? "c" : "a")) as "a" | "b" | "c" | "d" | "s";
          if (Array.isArray(existingSeen[poolKey]) && !existingSeen[poolKey].includes(qq.number)) {
            existingSeen[poolKey].push(qq.number);
          }
        });
        document.cookie = `exam_seen_state=${encodeURIComponent(JSON.stringify(existingSeen))}; path=/; max-age=2592000; samesite=lax`;
      } catch {}
    }

    // Persist the attempt so the dashboard reflects it (fire-and-forget).
    if (moduleId || examMode) {
      const answersArr = activeQuestions.map((qq) => ({
        questionId: qq.id,
        selectedKey: current[qq.id] ?? null,
        correct: current[qq.id] === correctKeys[qq.id],
      }));
      fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: examMode ? undefined : moduleId,
          kind: examMode ? "exam" : "module",
          score: result.score,
          passed: result.passed,
          answers: answersArr,
        }),
      }).catch(() => {});
    }
  };

  // Countdown timer (only when a time limit is set).
  useEffect(() => {
    if (!timeLimitSec || showResult) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLimitSec, showResult]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (timeLimitSec && !showResult && remaining === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timeLimitSec, showResult]);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleSelect = (key: string) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [q.id]: key }));
  };

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finish();
    }
  };

  const highlightNumbers = (text: string) => {
    const parts = text.split(/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i);
    return parts.map((part, i) => {
      if (/(\d+(?:\.\d+)?\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)?)/i.test(part)) {
        return <strong key={i} className="font-bold text-cyan-300">{part}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (showResult && scoreData) {
    const correctKeys: Record<string, string> = {};
    activeQuestions.forEach((question) => {
      correctKeys[question.id] = getCorrectKey(question);
    });

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 p-4 md:p-8 text-cyan-50">
        <h2 className="text-glow flex items-center justify-center gap-2 text-3xl font-extrabold text-white">
          {scoreData.passed ? (
            <>
              <Trophy className="h-8 w-8 text-amber-300" />
              <span>Watsinze!</span>
            </>
          ) : (
            <span>Ongera Ugerageze</span>
          )}
        </h2>
        <div className={`text-6xl font-black ${scoreData.passed ? "text-emerald-300" : "text-red-300"}`}>
          {scoreData.correct} / {scoreData.total}
        </div>
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${scoreData.passed ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
            style={{ width: `${scoreData.score}%` }}
          />
        </div>
        <p className="text-sm text-cyan-100/70">Amanota: {scoreData.score}%</p>

        <div className="mt-8 flex w-full flex-col gap-4 text-left">
          <h3 className="border-b border-cyan-400/20 pb-2 text-xl font-bold text-white">Ibisubizo N&apos;Ubusobanuro (Review)</h3>
          {activeQuestions.map((quizQ, idx) => {
            const userAnswer = answers[quizQ.id];
            const correctAnswerKey = correctKeys[quizQ.id];
            const userCorrect = userAnswer === correctAnswerKey;
            const isOpened = Boolean(openExplanationIds[quizQ.id]);
            const isThisLoading = loadingExplanationId === quizQ.id;
            const explanationContent = explanations[quizQ.id];

            return (
              <div
                key={quizQ.id}
                className={`glass space-y-2 rounded-2xl p-4 ${userCorrect ? "border-emerald-400/40" : "border-red-400/40"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-white">
                    {idx + 1}. {quizQ.category === "numeric" ? highlightNumbers(quizQ.text) : quizQ.text}
                  </p>
                  <span className="shrink-0 pt-0.5">
                    {userCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </span>
                </div>

                {quizQ.signImageUrl && (
                  <div className="flex justify-start py-1">
                    <img src={quizQ.signImageUrl} alt="Icyapa cy'Umuhanda" className="max-h-28 rounded-md border border-white/10 bg-white object-contain p-1" />
                  </div>
                )}

                <div className="mt-1 space-y-1 text-sm">
                  <p className={userCorrect ? "text-emerald-200" : "text-cyan-100/80"}>
                    Igisubizo Watoranyije:{" "}
                    {userAnswer ? (
                      <strong className="text-white">{userAnswer.toUpperCase()}. {quizQ.options.find((o) => o.key === userAnswer)?.text}</strong>
                    ) : (
                      <strong className="text-red-300">—</strong>
                    )}
                  </p>
                  {!userCorrect && (
                    <p className="text-emerald-300">
                      Igisubizo Cy&apos;Ukuri:{" "}
                      <strong>{correctAnswerKey.toUpperCase()}. {quizQ.options.find((o) => o.key === correctAnswerKey)?.text}</strong>
                    </p>
                  )}
                </div>

                {isOpened && (
                  <div className="mt-3 rounded-2xl border border-cyan-400/30 bg-slate-900/95 p-4 text-sm shadow-xl backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between border-b border-cyan-400/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-cyan-300" />
                        <strong className="font-semibold text-cyan-200">Mwarimu w&apos;Amategeko (AI)</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchExplanation(quizQ, correctAnswerKey, userAnswer)}
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-cyan-300/70 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Funga</span>
                      </button>
                    </div>

                    {isThisLoading ? (
                      <div className="flex items-center gap-3 py-3 text-cyan-200">
                        <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-xs">Mwarimu arimo gusesengura ikibazo n&apos;amategeko akigenga...</span>
                      </div>
                    ) : explanationContent ? (
                      <FormattedExplanation text={explanationContent} />
                    ) : (
                      <p className="text-xs text-amber-200">Nta busobanuro bwabonetse. Gerageza nanone.</p>
                    )}
                  </div>
                )}

                {!isOpened && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchExplanation(quizQ, correctAnswerKey, userAnswer)}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:bg-white/5 hover:text-cyan-100"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Saba ubusobanuro bwa Mwarimu (AI)</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {examMode ? (
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={async () => {
                setLoadingNextExam(true);
                try {
                  const res = await fetch("/api/exam/next", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const data = await res.json();
                  if (data?.ok && Array.isArray(data.questions) && data.questions.length === 20) {
                    setActiveQuestions(data.questions);
                    setCurrentIdx(0);
                    setAnswers({});
                    setShowResult(false);
                    setScoreData(null);
                    setRemaining(timeLimitSec ?? 20 * 60);
                    setExplanations({});
                    setOpenExplanationIds({});
                    finishedRef.current = false;
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                } catch (e) {
                  console.error("Failed to fetch next rotating exam:", e);
                } finally {
                  setLoadingNextExam(false);
                }
                window.location.reload();
              }}
              disabled={loadingNextExam}
              className="glow-btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-8 font-semibold text-white hover:from-cyan-400 hover:to-sky-400 sm:w-auto"
            >
              <span>{loadingNextExam ? "Birimo gutegurwa..." : "Komeza ku Bindi Bibazo 20 (Next)"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentIdx(0);
                setAnswers({});
                setShowResult(false);
                setScoreData(null);
                setRemaining(timeLimitSec ?? 20 * 60);
                setExplanations({});
                setOpenExplanationIds({});
                finishedRef.current = false;
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-white/5 px-6 font-semibold text-cyan-200 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <span>Subiramo Ibi Bibazo (Retry)</span>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => window.location.reload()}
            className="glow-btn mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-8 font-semibold text-white hover:from-cyan-400 hover:to-sky-400"
          >
            <span>Komeza Kwiga</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (!q) return <div className="text-cyan-100/80">Nta bibazo bihari.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-cyan-50">
      <div className="flex items-center justify-between text-sm font-medium text-cyan-100/65">
        <span>Ikibazo {currentIdx + 1} kuri {activeQuestions.length}</span>
        {timeLimitSec ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tabular-nums ${
              remaining <= 60 ? "bg-red-500/20 text-red-200 animate-pulse-glow" : "bg-cyan-400/15 text-cyan-200"
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>{mmss(remaining)}</span>
          </span>
        ) : (
          <span>Amanota yawe y&apos;agateganyo</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all" style={{ width: `${(currentIdx / activeQuestions.length) * 100}%` }} />
      </div>

      <div className="hud glass rounded-2xl p-6 md:p-8">
        {q.signImageUrl && (
          <div className="mb-6 flex w-full justify-center">
            <img src={q.signImageUrl} alt="Icyapa cy'Umuhanda" className="max-h-64 rounded-lg border border-white/10 bg-white object-contain p-2" />
          </div>
        )}

        <h2 className="text-xl font-semibold leading-relaxed text-white md:text-2xl">
          {q.category === "numeric" ? highlightNumbers(q.text) : q.text}
        </h2>

        <div className="mt-8 space-y-3">
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-cyan-400/70 bg-cyan-500/15 ring-2 ring-cyan-400/40"
                    : "border-cyan-400/15 bg-white/5 hover:border-cyan-400/40 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold ${
                      selected ? "border-cyan-300 bg-cyan-500 text-white" : "border-cyan-400/30 text-cyan-200"
                    }`}
                  >
                    {opt.key.toUpperCase()}
                  </div>
                  <span className="text-base text-cyan-50 md:text-lg">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          size="lg"
          variant="ghost"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-400/25 bg-white/5 px-5 text-cyan-100/85 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Subira inyuma</span>
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!answers[q.id]}
          className="glow-btn inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50"
        >
          <span>{currentIdx === questions.length - 1 ? "Ohereza" : "Komeza"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
