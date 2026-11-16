import { auth } from "@/lib/auth";
import { db } from "@/db";
import { certificates, quizAttempts, courses } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/BackButton";
import { Award, CheckCircle2, ShieldCheck, ExternalLink, Timer, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let userCerts: (typeof certificates.$inferSelect)[] = [];
  let passedAttempts: (typeof quizAttempts.$inferSelect)[] = [];

  if (userId) {
    try {
      [userCerts, passedAttempts] = await Promise.all([
        db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt)),
        db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.passed, true))).orderBy(desc(quizAttempts.attemptedAt)),
      ]);
    } catch {
      // Fallback if DB is unavailable
    }
  }

  const hasPassedExam = passedAttempts.some((a) => Number(a.score) >= 70);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <BackButton label="Subira ku Ahabanza" fallback="/dashboard" />

      <div className="hud glass relative rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              Icyemezo Cyemewe (Official Completion Verification)
            </span>
            <h1 className="mt-2 text-glow text-2xl font-extrabold text-white md:text-3xl">
              Ibyemezo Byanjye (Certificates)
            </h1>
            <p className="mt-1.5 text-sm text-cyan-100/70">
              Aha ni ho ubonera icyemezo cy&apos;uko watsinze ibizamini by&apos;imyitozo y&apos;amategeko y&apos;umuhanda (Provisoire).
            </p>
          </div>
          <div className="shrink-0">
            <Link href="/exam">
              <Button className="glow-btn flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                <Timer className="h-4 w-4" />
                Kora Ikizamini ⏱
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {userCerts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {userCerts.map((cert) => (
            <div key={cert.id} className="hud glass is-interactive flex flex-col justify-between rounded-2xl p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    Cyemejwe (Verified)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Icyemezo cyo Gutsinda Amategeko y&apos;Umuhanda
                </h3>
                <p className="text-xs text-cyan-100/60 font-mono">
                  Kode y&apos;Umwimerere: {cert.verifyCode}
                </p>
                <p className="text-xs text-cyan-100/50">
                  Italiki: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("rw-RW") : "N/A"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-400/15">
                <Link href={`/certificate/${cert.verifyCode}`} target="_blank" className="block">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 rounded-xl border-cyan-400/30 text-cyan-100 hover:bg-white/10 hover:text-white">
                    <ExternalLink className="h-4 w-4" />
                    Fungura Icyemezo (View Certificate)
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : hasPassedExam ? (
        <div className="hud glass rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Watsinze Ikizamini ku Manota 70% cyangwa Arenzeho!</h2>
          <p className="mx-auto max-w-lg text-sm text-cyan-100/70">
            Konti yawe ifite amanota meza mu bizamini wakoze. Urashobora kugenzura umwimerere w&apos;ibizamini wakoze ukoresheje kode y&apos;icyemezo cy&apos;agateganyo:
          </p>
          <div className="pt-2">
            <Link href={`/certificate/PROV-${userId?.slice(0, 8).toUpperCase() || "RWANDA"}`}>
              <Button className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 font-semibold text-white">
                <Award className="h-4 w-4" />
                Reba Icyemezo Cyawe (View Certificate)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Nta cyemezo urabona kugeza ubu</h2>
          <p className="mx-auto max-w-md text-sm text-cyan-100/65">
            Kugira ngo ubone icyemezo cy&apos;uko watsinze (Certificate of Achievement), kora Ikizamini Rusange cy&apos;Iminota 20 ubone nibura amanota 70% (14/20 cyangwa hejuru yayo).
          </p>
          <div className="pt-2">
            <Link href="/exam">
              <Button className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                <Timer className="h-4 w-4" />
                Tangira Ikizamini Ubu ⏱
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
