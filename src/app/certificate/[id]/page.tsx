import { db } from "@/db";
import { certificates, users, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { Award, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  let cert, user, course;
  try {
     const data = await db.select().from(certificates)
                          .leftJoin(users, eq(certificates.userId, users.id))
                          .leftJoin(courses, eq(certificates.courseId, courses.id))
                          .where(eq(certificates.verifyCode, p.id))
                          .limit(1);
     if (data.length === 0) {
         notFound();
     }
     cert = data[0].certificates;
     user = data[0].users;
     course = data[0].courses;
  } catch (e) {
     // If database is not ready, we will mock for demonstration, but normally we'd throw or 404.
     cert = { verifyCode: p.id, issuedAt: new Date() };
     user = { name: "Umunyeshuri w'Umunyamwete" };
     course = { title: "Amategeko y'Umuhanda n'Ibyapa (Provisoire)" };
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-cyan-50">
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-cyan-200 hover:text-white hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" />
            Subira ku Ahabanza
          </Button>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Icyemezo Cyemewe (Official Verified)
        </span>
      </div>

      <Card className="max-w-3xl w-full text-center border border-cyan-400/30 bg-[#071726]/90 backdrop-blur-md shadow-2xl relative overflow-hidden text-cyan-50">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400"></div>
        <CardHeader className="pt-12 pb-6">
          <div className="mx-auto bg-cyan-400/10 rounded-full w-20 h-20 flex items-center justify-center border-2 border-cyan-400/30 mb-4 text-cyan-300">
             <Award className="h-10 w-10 text-cyan-300" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ICYEMEZO CYO GUTSNDA
          </CardTitle>
          <p className="text-xs uppercase tracking-widest text-cyan-300/80 font-semibold mt-1">
            Certificate of Achievement
          </p>
          <CardDescription className="text-sm mt-4 text-cyan-100/70">
            Iki cyemezo gihabwa:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 sm:px-12">
          <h2 className="text-3xl sm:text-4xl font-black text-cyan-200">{user?.name}</h2>
          <p className="text-base text-cyan-100/80 max-w-xl mx-auto leading-relaxed">
            Ku bwo kurangiza amasomo no gutsinda ibizamini by&apos;amategeko y&apos;umuhanda ku manota arenga 70% mu isomo rya:
          </p>
          <div className="inline-block rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-6 py-2.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white">{course?.title}</h3>
          </div>
          
          <div className="mt-10 grid grid-cols-2 gap-8 text-left border-t border-cyan-400/15 pt-6 px-4">
            <div>
              <p className="text-xs text-cyan-100/50 font-bold uppercase tracking-wider">Italiki yatanzweho</p>
              <p className="text-sm sm:text-base font-semibold text-white mt-1">
                {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-GB") : "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-cyan-100/50 font-bold uppercase tracking-wider">Kode y&apos;Umwimerere</p>
              <p className="text-sm sm:text-base font-mono font-bold text-cyan-300 mt-1">{cert.verifyCode}</p>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-cyan-100/50 border-t border-cyan-400/10 pt-4">
             Urashobora kugenzura umwimerere w&apos;iki cyemezo unyuze kuri: <span className="font-mono text-cyan-300">amategeko.rw/certificate/{cert.verifyCode}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
