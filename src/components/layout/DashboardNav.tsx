"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, Award, Shield } from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "Ahabanza (Dashboard)",
    icon: LayoutDashboard,
  },
  {
    href: "/courses",
    label: "Amasomo (Courses)",
    icon: BookOpen,
  },
  {
    href: "/certificates",
    label: "Ibyemezo (Certificates)",
    icon: Award,
  },
];

const adminItem = {
  href: "/admin",
  label: "Admin (Abakoresha)",
  icon: Shield,
};

export function DashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const navItems = isAdmin ? [...items, adminItem] : items;
  return (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "glass-soft font-semibold text-white ring-accent"
                : "text-cyan-100/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-cyan-300" : "text-cyan-100/50")} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
