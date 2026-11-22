import { db } from "@/db";
import { certificates, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";

export default async function AdminCertificatesPage() {
  let certList: {
    user: typeof users.$inferSelect | null;
    id: string;
    userId: string;
    courseId: string;
    verifyCode: string;
    pdfUrl: string | null;
    issuedAt: Date | null;
  }[] = [];

  try {
    const data = await db
      .select()
      .from(certificates)
      .leftJoin(users, eq(certificates.userId, users.id))
      .orderBy(asc(certificates.issuedAt))
      .limit(100);
    certList = data.map((row) => ({ ...row.certificates, user: row.users }));
  } catch {
    certList = [];
  }

  return (
    <div className="space-y-6 text-cyan-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Ibyemezo (Certificates)</h1>
          <p className="mt-1 text-sm text-cyan-100/65">
            Genzura ibyemezo byatanzwe ku banyeshuri batsinze ibizamini byose.
          </p>
        </div>
        <div className="glass-soft flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-amber-300">
          <Award className="h-4 w-4" />
          <span>Ibyemezo {certList.length}</span>
        </div>
      </div>

      {certList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-cyan-100/50">
          Nta byemezo biratangwa cyangwa database ntiyacometse neza.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Certificate Cards (NO HORIZONTAL SCROLL) */}
          <div className="space-y-3 md:hidden">
            {certList.map((cert) => (
              <div key={cert.id} className="glass space-y-3 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="block text-[10px] uppercase text-cyan-100/50">Code Umwimerere</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">{cert.verifyCode}</span>
                  </div>
                  <Link
                    href={`/certificate/${cert.verifyCode}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-white/5 px-2.5 py-1 text-xs font-semibold text-cyan-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <span>Reba</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-400/10 bg-white/[0.03] p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-cyan-100/50">Umunyeshuri</span>
                    <span className="truncate font-medium text-white block">
                      {cert.user?.name || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-cyan-100/50">Italiki</span>
                    <span className="text-cyan-100/80 font-medium">
                      {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-GB") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Full Data Table */}
          <div className="glass hidden overflow-hidden rounded-2xl md:block">
            <div className="border-b border-cyan-400/15 p-5">
              <h2 className="text-lg font-bold text-white">Ibyemezo Byatanzwe ({certList.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-cyan-100/60">
                  <tr>
                    <th className="px-6 py-3.5">Code Umwimerere (Verify Code)</th>
                    <th className="px-6 py-3.5">Umunyeshuri</th>
                    <th className="px-6 py-3.5">Italiki Cyatangiweho</th>
                    <th className="px-6 py-3.5">Kureba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-400/10">
                  {certList.map((cert) => (
                    <tr key={cert.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-mono font-semibold text-cyan-300">{cert.verifyCode}</td>
                      <td className="px-6 py-4 font-medium text-white">{cert.user?.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-cyan-100/70">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-GB") : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/certificate/${cert.verifyCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-white/5 px-2.5 py-1 text-xs text-cyan-200 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <span>Reba</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
