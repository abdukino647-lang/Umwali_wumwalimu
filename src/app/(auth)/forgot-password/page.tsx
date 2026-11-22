"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";
import { KeyRound, ArrowRight, Loader2, Copy, Check, MailCheck, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [fullResetUrl, setFullResetUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResetLink(null);
    setFullResetUrl(null);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok && data.notFound) {
        setError(data.message || "Nta konti ifite iyi email twabonye.");
        return;
      }

      setMessage(data.message || "Ubusabe bwawe bwakiriwe neza.");
      setEmailed(Boolean(data.emailed));

      const linkToUse = data.relativeResetLink || data.resetLink || data.devResetLink;
      if (linkToUse) {
        setResetLink(linkToUse);
      }
      if (data.resetLink || data.devResetLink) {
        setFullResetUrl(data.resetLink || data.devResetLink);
      }
    } catch {
      setError("Seriveri ntiyitabye. Ongera ugerageze nyuma.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopyLink = () => {
    if (!fullResetUrl && !resetLink) return;
    const url = fullResetUrl || (typeof window !== "undefined" ? `${window.location.origin}${resetLink}` : resetLink || "");
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
        <div className="hud glass relative z-10 w-full max-w-lg rounded-3xl p-7 md:p-9">
          <div className="mb-6 text-center">
            <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Wibagiwe Ijambo ry&apos;Ibanga?</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              Andika email yawe, uhite ubona link yo guhindura ijambo ry&apos;ibanga mu gihe nyacyo.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">{error}</p>
                <p className="mt-1 text-cyan-100/60">
                  Nta konti ufite? <Link href="/register" className="font-medium text-cyan-300 hover:underline">Iyandikishe hano</Link>
                </p>
              </div>
            </div>
          )}

          {resetLink ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-950/40 p-4 sm:p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Ubusabe bwakiriwe neza!</h2>
                <p className="mt-1.5 text-xs text-cyan-100/75 leading-relaxed">
                  {message}
                </p>

                {emailed && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    <Check className="h-3 w-3" />
                    <span>Email yoherejwe kuri Inbox / Spam</span>
                  </div>
                )}
              </div>

              {/* Instant Real-Time Reset Button */}
              <div className="space-y-3 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4 text-xs text-amber-100">
                <p className="font-semibold text-amber-200 text-sm">
                  Guhindura Ijambo ry&apos;Ibanga Ako Kanya (Mu gihe nyacyo):
                </p>
                <p className="text-cyan-100/75 text-xs leading-relaxed">
                  Kanda kuri iyi buto ikurikira kugira ngo ushyireho ijambo ry&apos;ibanga rishya ako kanya utiriwe utegereza:
                </p>
                <Link
                  href={resetLink.replace(/^https?:\/\/[^/]+/, "")}
                  className="glow-btn flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.01]"
                >
                  <KeyRound className="h-5 w-5" />
                  <span className="text-sm">Hindura Ijambo ry&apos;Ibanga Ubu</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="pt-2 border-t border-amber-400/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-cyan-100/60 truncate max-w-xs">
                    Link imara isaha 1 gusa.
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Byakoporowe!" : "Koporora Magic Link"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs font-medium text-cyan-300 transition-colors hover:underline"
                >
                  Subira ku Kwinjira (Login)
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-cyan-100/80">Email yawe</Label>
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
                Wibutse ijambo ry&apos;ibanga?{" "}
                <Link href="/login" className="font-medium text-cyan-300 hover:underline">Injira hano</Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
