"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing, SecurityStatus, NextStep, fieldIcon } from "@/components/layout/AuthChrome";
import { TechBackground } from "@/components/layout/TechBackground";
import { BackButton } from "@/components/layout/BackButton";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        setError("Konti irashobora kuba isanzweho cyangwa habaye ikibazo. (Could not register.)");
      }
    } catch {
      setError("Seriveri ntiyitabye. Ongera ugerageze. (Server unreachable.)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-cyan-50">
      <TechBackground variant="network" />
      <header className="relative z-20 flex h-16 w-full shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
          Amategeko y&apos;Umuhanda
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm text-cyan-100/80 hover:text-white sm:inline">
            Injira
          </Link>
          <BackButton to="/" />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className="hud glass relative z-10 w-full max-w-4xl rounded-3xl p-6 md:p-8">
          <div className="mx-auto mb-6 w-fit rounded-full glass-soft px-5 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
            Advanced Profile and Training Portal
          </div>

        <div className="mb-7 text-center">
          <h1 className="text-glow text-2xl font-extrabold text-white md:text-3xl">Kwiyandikisha (Register)</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-cyan-100/65">
            Uzuza imyirondoro yawe hasi aha kugira ngo ufungure konti kandi utangire kwiga amategeko y&apos;umuhanda mu buryo bugezweho.
          </p>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[160px_1fr_180px]">
          {/* Left: training progress */}
          <div className="order-2 rounded-2xl glass-soft p-4 text-center md:order-1">
            <p className="mb-3 text-xs font-medium text-cyan-100/70">Training Progress</p>
            <ProgressRing value={15} />
            <p className="mt-3 text-[11px] text-cyan-100/60">Core Modules: 15% complete</p>
          </div>

          {/* Center: form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="order-1 space-y-4 md:order-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-cyan-100/80">Amazina</Label>
              <div className="relative">
                {fieldIcon("user")}
                <Input id="name" placeholder="Amazina yawe..." className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("name")} />
              </div>
              {form.formState.errors.name && <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-cyan-100/80">Email</Label>
              <div className="relative">
                {fieldIcon("mail")}
                <Input id="email" type="email" placeholder="m.g@example.com" className="h-11 border-cyan-400/20 bg-white/5 pl-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("email")} />
              </div>
              {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-cyan-100/80">Ijambo ry&apos;Ibanga (Password)</Label>
              <div className="relative">
                {fieldIcon("lock")}
                <Input id="password" type={showPw ? "text" : "password"} placeholder="Ijambo ry'ibanga..." className="h-11 border-cyan-400/20 bg-white/5 px-10 text-white placeholder:text-cyan-100/40 focus-visible:border-cyan-400/60" {...form.register("password")} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/50 hover:text-cyan-200" aria-label="toggle password">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>}
            </div>
            {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300" role="alert">{error}</p>}
            <Button type="submit" disabled={isLoading} className="glow-btn flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 font-semibold text-white hover:from-cyan-400 hover:to-sky-400">
              <UserPlus className="h-4 w-4" />
              <span>{isLoading ? "Tegereza..." : "Iyandikishe Ubu"}</span>
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-cyan-400/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-cyan-100/60 backdrop-blur-sm">Cyangwa (Or)</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-white/5 font-medium text-white hover:bg-white/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Komeza na Google (Continue with Google)
            </Button>
          </form>

          {/* Right: security status */}
          <div className="order-3 rounded-2xl glass-soft p-4">
            <p className="mb-3 text-center text-xs font-medium text-cyan-100/70">System Security Status</p>
            <SecurityStatus />
          </div>
        </div>

        <div className="mt-7 rounded-2xl glass-soft p-4">
          <p className="mb-3 text-center text-xs font-semibold tracking-wide text-cyan-200">Recommended Next Steps</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <NextStep title="Take a Skill Assessment" />
            <NextStep title="View Advanced Signage Library" />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-cyan-100/60">
          Usanzwe ufite konti?{" "}
          <Link href="/login" className="font-medium text-cyan-300 hover:underline">Injira hano</Link>
        </p>
      </div>
    </main>
  </div>
);
}
