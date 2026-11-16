"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDevLink(null);
    setEmailError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Twakiriye ubusabe bwawe. Reba muri email yawe.");
      if (data.devResetLink) setDevLink(data.devResetLink);
      if (data.emailError) setEmailError(data.emailError);
    } catch {
      setMessage("Seriveri ntiyitabye. Ongera ugerageze nyuma.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-cyan-50">
      <TechBackground variant="network" />
      <header className="relative z-20 flex h-16 w-full shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
          Amategeko y&apos;Umuhanda
        </span>
        <BackButton to="/login" label="Subira ku Kwinjira" className="shrink-0" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className="hud glass relative z-10 w-full max-w-md rounded-3xl p-7 md:p-9">
          <div className="mb-6 text-center">
            <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Wibagiwe Ijambo ry&apos;Ibanga?</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              Andika email yawe, tuzakohereza link yo guhindura ijambo ry&apos;ibanga.
            </p>
          </div>

          {message ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3.5 text-sm leading-relaxed text-cyan-50">
                {message}
              </p>

              {devLink && (
                <div className="space-y-2.5 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-xs text-amber-100">
                  <p className="font-semibold text-amber-200">
                    Guhindura Ijambo ry&apos;Ibanga ako kanya:
                  </p>
                  <p className="text-cyan-100/70">
                    Kanda kuri iyi buto hasi uhite ushyiraho ijambo ry&apos;ibanga rishya utarindiriye email:
                  </p>
                  <Link
                    href={devLink.replace(/^https?:\/\/[^/]+/, "")}
                    className="glow-btn flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-slate-950 transition-transform hover:scale-[1.01]"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>Hindura Ijambo ry&apos;Ibanga Ubu</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {emailError && (
                    <p className="mt-1 font-mono text-[11px] text-amber-300/80">
                      Imvo ya Resend: {emailError}
                    </p>
                  )}
                </div>
              )}

              <Link
                href="/login"
                className="block text-center text-sm font-medium text-cyan-300 transition-colors hover:underline"
              >
                Subira ku Kwinjira (Login)
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-cyan-100/80">Email</Label>
                <div className="relative">
                  {fieldIcon("mail")}
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="m.g@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="glow-btn flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Tegereza...</span>
                  </>
                ) : (
                  <span>Ohereza link yo gusubiramo</span>
                )}
              </Button>
              <p className="text-center text-sm text-cyan-100/60">
                Wibutse?{" "}
                <Link href="/login" className="font-medium text-cyan-300 hover:underline">Injira hano</Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
