import { db } from "@/db";
import { questions } from "@/db/schema";
import { asc } from "drizzle-orm";
import { HelpCircle } from "lucide-react";

export default async function AdminQuestionsPage() {
  // Fetch questions for review
  let qList: (typeof questions.$inferSelect)[] = [];
  try {
     qList = await db.select().from(questions).orderBy(asc(questions.number)).limit(50);
  } catch (e) {
     qList = []; // If db is not yet initialized
  }

  return (
    <div className="space-y-6 text-cyan-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Urubuga rw&apos;Ibibazo (Questions)</h1>
          <p className="mt-1 text-sm text-cyan-100/65">
            Ububiko bw&apos;ibibazo by&apos;ikizamini cy&apos;uruhushya rwo gutwara ibinyabiziga.
          </p>
        </div>
        <div className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-cyan-200">
          <HelpCircle className="h-4 w-4 text-cyan-300" />
          <span>Ibibazo {qList.length}</span>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-cyan-400/15 p-5">
          <h2 className="text-lg font-bold text-white">Ibibazo Byatoranyijwe</h2>
        </div>
        {qList.length === 0 ? (
          <div className="p-8 text-center text-sm text-cyan-100/50">
            Nta bibazo birashyirwamo cyangwa database ntiyacometse neza.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-cyan-100/60">
                <tr>
                  <th className="px-6 py-3.5">No</th>
                  <th className="px-6 py-3.5">Ikibazo</th>
                  <th className="px-6 py-3.5">Icyiciro</th>
                  <th className="px-6 py-3.5">Igisubizo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10">
                {qList.map((q) => (
                  <tr key={q.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4 font-semibold text-cyan-300">{q.number}</td>
                    <td className="max-w-md px-6 py-4 font-medium text-white">{q.text}</td>
                    <td className="px-6 py-4 capitalize text-cyan-200">{q.category}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15 font-bold uppercase text-emerald-300">
                        {q.correctKey}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
