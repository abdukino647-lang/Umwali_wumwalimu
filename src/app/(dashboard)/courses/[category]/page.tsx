import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/BackButton";
import { notFound } from "next/navigation";
import { getCourses, getModules } from "@/lib/catalog";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const p = await params;
  const validCategories = ["text", "numeric", "ibyapa"];
  if (!validCategories.includes(p.category)) {
    notFound();
  }

  // Course + its modules from the cached catalog (no DB round-trip on nav).
  const [allCourses, allModules] = await Promise.all([getCourses(), getModules()]);
  const found = allCourses.find((c) => c.category === (p.category as typeof c.category));
  const course = found ?? { id: "dummy", title: `Category: ${p.category}`, description: "Amasomo" };

  const newLawsModule = {
    id: "amategeko-mashya",
    title: "Ibyapa Bishya n'Amategeko Mashya",
    content: "Ibyapa bishya n'amabwiriza agezweho y'umutekano wo mu muhanda",
  };

  const moduleList = found && allModules.filter((m) => m.courseId === found.id).length > 0
    ? [...allModules.filter((m) => m.courseId === found.id), newLawsModule]
    : [
        newLawsModule,
        { id: "ikizamini-cyose", title: "Ikizamini Rusange (All Questions)", content: "Gerageza ibibazo byose muri iyi category" },
        { id: "ikizamini-gito", title: "Ikizamini Gito (Quick Test)", content: "Ibibazo 10 by'igerageza byihuse" },
      ];

  return (
    <div className="space-y-6">
      <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />
      <div className="hud glass relative rounded-2xl p-6">
        <h1 className="text-glow text-2xl font-extrabold capitalize text-white md:text-3xl">{course.title}</h1>
        <p className="mt-2 text-sm text-cyan-100/65">{course.description}</p>
      </div>

      <div className="grid gap-4">
        {moduleList.map((mod, index) => {
          const isHighlight = mod.id === "amategeko-mashya";
          return (
            <div
              key={mod.id}
              className={`glass is-interactive flex flex-col gap-3 rounded-2xl p-5 transition-all sm:flex-row sm:items-center sm:justify-between ${
                isHighlight ? "border-cyan-400/50 bg-cyan-950/20 ring-1 ring-cyan-400/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                  isHighlight ? "bg-cyan-400/20 text-cyan-200" : "glass-soft text-cyan-300"
                }`}>
                  {isHighlight ? <Sparkles className="h-4 w-4" /> : index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{mod.title}</h3>
                  <p className="mt-0.5 text-xs text-cyan-100/60">{mod.content}</p>
                </div>
              </div>
              <Link href={`/courses/${p.category}/${mod.id}/quiz`} className="shrink-0">
                <Button className="glow-btn flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                  <span>Kora Ikizamini</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
