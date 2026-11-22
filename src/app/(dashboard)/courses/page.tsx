import { auth } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCourses, getModules } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/layout/AuthChrome";
import { BackButton } from "@/components/layout/BackButton";
import { CheckCircle2, ArrowRight, Play, Timer } from "lucide-react";

const categories = [
  {
    cat: "text" as const,
    tag: "Category A: Amategeko Rusange",
    desc: "Ibibazo by'amategeko gusa",
    href: "/courses/text",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
  },
  {
    cat: "numeric" as const,
    tag: "Category B: Ingero n'Ibipimo",
    desc: "Ibibazo birimo imibare",
    href: "/courses/numeric",
    icon: (
      <>
        <path d="M12 3v18M5 8h14M5 8l-2 5a3 3 0 006 0zM19 8l-2 5a3 3 0 006 0z" />
      </>
    ),
  },
  {
    cat: "ibyapa" as const,
    tag: "Category C: Ibyapa",
    desc: "Ibimenyetso (Road Signs)",
    href: "/courses/ibyapa",
    icon: (
      <>
        <path d="M12 2v4M7 22h10M12 18v4" />
        <path d="M9 6h6l-2 5h-2zM7 11h10l-2 5H9z" />
      </>
    ),
  },
  {
    cat: "new" as const,
    tag: "Category D: Ibyapa n'Amategeko Mashya",
    desc: "Ibyapa bishya n'amategeko agezweho",
    href: "/courses/ibyapa/amategeko-mashya/quiz",
    icon: (
      <>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </>
    ),
  },
];

export default async function CoursesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [allCourses, allModules, userAttempts] = await Promise.all([
    getCourses(),
    getModules(),
    userId
      ? db.select({ moduleId: quizAttempts.moduleId }).from(quizAttempts).where(eq(quizAttempts.userId, userId))
      : Promise.resolve([] as { moduleId: string | null }[]),
  ]);
  const doneModules = new Set(userAttempts.map((a) => a.moduleId));
  const pctFor = (cat: string) => {
    if (cat === "new") {
      return doneModules.has("amategeko-mashya") ? 100 : 0;
    }
    const course = allCourses.find((c) => c.category === cat);
    if (!course) return 0;
    const mods = allModules.filter((m) => m.courseId === course.id);
    if (mods.length === 0) return 0;
    const done = mods.filter((m) => doneModules.has(m.id)).length;
    return Math.round((done / mods.length) * 100);
  };

  return (
    <div className="space-y-6">
      <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      <div className="hud glass relative rounded-2xl p-6">
        <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Amasomo (Courses)</h1>
        <p className="mt-2 text-sm text-cyan-100/65">Hitamo icyiciro wige kandi ukoremo ibizamini (Ibizamini).</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => {
          const pct = pctFor(c.cat);
          return (
            <div key={c.href} className="hud glass is-interactive relative flex flex-col rounded-2xl p-6 transition-all">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{c.tag}</h3>
                  <p className="mt-1 text-xs text-cyan-100/60">{c.desc}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-cyan-300/80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
              </div>

              <div className="mb-5 flex items-center gap-4">
                <ProgressRing value={pct} size={72} />
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${pct >= 100 ? "bg-emerald-400/20 text-emerald-200" : "bg-cyan-400/15 text-cyan-200"}`}>
                  {pct >= 100 ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Byarangiye
                    </>
                  ) : pct > 0 ? (
                    "Birakomeza"
                  ) : (
                    "Active"
                  )}
                </span>
              </div>

              <Link href={c.href} className="mt-auto block">
                <Button className="glow-btn flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 font-semibold text-white hover:from-cyan-400 hover:to-sky-500">
                  <span>Komeza Kwiga</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Mixed mock exam shortcut */}
      <Link href="/exam" className="hud glass is-interactive relative block rounded-2xl p-5 transition-all">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl glass-soft text-cyan-300">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">Ikizamini Rusange cy&apos;Iminota 20</h3>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-cyan-200">
                  <Timer className="h-3 w-3" /> Iminota 20
                </span>
                <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-cyan-200">Ibibazo 20</span>
              </div>
            </div>
          </div>
          <span className="glow-btn inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 font-semibold text-white">
            <Play className="h-4 w-4" /> Tangira
          </span>
        </div>
      </Link>
    </div>
  );
}
