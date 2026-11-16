import { auth } from "@/lib/auth";
import { currentUserRole } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TechBackground } from "@/components/layout/TechBackground";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";
import { Users, BookOpenCheck, HelpCircle, Award, LogOut, ArrowLeft } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Abakoresha (Users)", icon: Users },
  { href: "/admin/exams", label: "Gutunganya Ibizamini", icon: BookOpenCheck },
  { href: "/admin/questions", label: "Ibibazo (Questions)", icon: HelpCircle },
  { href: "/admin/certificates", label: "Ibyemezo (Certificates)", icon: Award },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  // Check the role against the DB, not the token (which may be stale on another
  // device), so a real admin is never bounced to /dashboard.
  if ((await currentUserRole()) !== "admin") redirect("/dashboard");

  const signOutAction = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-cyan-50">
      <TechBackground variant="network" />
      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-cyan-400/15 bg-[#06121d]/70 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
          <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">Amategeko Admin</span>
          <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-2.5 text-xs text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ahabanza</span>
          </Link>
          <span className="hidden text-sm font-medium text-cyan-100/85 sm:inline">{session.user?.name}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-white/5 px-2.5 text-xs text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sohoka</span>
            </button>
          </form>
        </div>
      </header>

      <div className="relative z-10 flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-cyan-400/12 p-4 md:block">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cyan-100/70 transition-all hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8 lg:p-10">{children}</main>
      </div>

      <AdminMobileNav />

      <footer className="relative z-10 hidden border-t border-cyan-400/10 px-6 py-4 text-center md:block">
        <p className="text-xs text-cyan-100/45">© 2026 Amategeko y&apos;Umuhanda Admin. All rights reserved.</p>
      </footer>
    </div>
  );
}
