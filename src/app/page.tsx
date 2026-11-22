import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TechBackground } from "@/components/layout/TechBackground";
import { WHATSAPP_URL } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { UserPlus, BookOpen, Award, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-cyan-50">
      <TechBackground variant="city" />
      {/* Header */}
      <header className="relative z-10 flex h-16 items-center px-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Amategeko y&apos;Umuhanda</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg px-3 py-1.5 text-cyan-100/80 transition-colors hover:text-white">
            Injira (Login)
          </Link>
          <span className="text-cyan-100/30">/</span>
          <Link href="/register" className="rounded-lg px-3 py-1.5 text-cyan-100/80 transition-colors hover:text-white">
            Iyandikishe (Register)
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-12 pb-8 text-center md:pt-20">
          <div className="hud glass relative w-full max-w-3xl rounded-3xl px-6 py-12 md:px-14 md:py-16">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-medium text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
              Advanced Driving-Law Platform
            </p>
            <h1 className="text-glow text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Uburyo Bwiza bwo Kwiga Amategeko y&apos;Umuhanda mu Rwanda
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cyan-100/75 md:text-base">
              Iga amategeko y&apos;umuhanda, kora imyitozo ihuye neza n&apos;ikizamini cya Polisi, kandi utsinde ibizamini byo kubona uruhushya rw&apos;agateganyo rwo gutwara ibinyabiziga (Provisoire).
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/register">
                <Button className="glow-btn flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-7 text-sm font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
                  <span>Tangira Kwiga Ubu</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-white">Uko Bikora (How It Works)</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Kwiyandikisha (Register)",
                desc: "Fungura konti yawe mu buryo bworoshye kandi bwihuse kugira ngo utangire gukurikirana amasomo n'imyitozo yawe.",
                meta: "Ubufasha bwa 24/7",
                icon: UserPlus,
              },
              {
                title: "Kwiga no Kwitoza (Study)",
                desc: "Wige amategeko rusange, ibyapa n'ibimenyetso by'umuhanda, hamwe n'ingero zifatika bisobanuwe mu Kinyarwanda cyumvikana neza.",
                meta: "Ibibazo 400+ n'Amafoto Nyayo",
                icon: BookOpen,
              },
              {
                title: "Gutsinda Ikizamini (Certify)",
                desc: "Kora ibizamini by'imyitozo by'iminota 20 bisubiramo ibibazo bya Polisi, utsinde ku kigero cya 70% cyangwa kurengaho kugira ngo witegure neza.",
                meta: "Amanota Fatizo: 70%",
                icon: Award,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="hud glass is-interactive relative rounded-2xl p-6 transition-all">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl glass-soft text-cyan-300">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cyan-100/65">{s.desc}</p>
                  <div className="mt-5 border-t border-cyan-400/15 pt-3 text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">
                    {s.meta}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col items-center gap-2 border-t border-cyan-400/10 px-6 py-5 sm:flex-row">
        <p className="text-xs text-cyan-100/50">© 2026 Amategeko y&apos;Umuhanda Platform. Uburenganzira bwose burabitswe.</p>
        <nav className="sm:ml-auto flex items-center gap-5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#25D366] transition-colors hover:text-white"
            title="Tuvugishe kuri WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>
          <Link href="/login" className="text-xs text-cyan-100/50 transition-colors hover:text-white">Kwinjira</Link>
          <Link href="/register" className="text-xs text-cyan-100/50 transition-colors hover:text-white">Kwiyandikisha</Link>
        </nav>
      </footer>
    </div>
  );
}
