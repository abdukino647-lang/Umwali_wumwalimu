"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BookOpenCheck, HelpCircle, Award, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin",
    label: "Abakoresha",
    icon: Users,
    exact: true,
  },
  {
    href: "/admin/exams",
    label: "Ibizamini",
    icon: BookOpenCheck,
    exact: false,
  },
  {
    href: "/admin/questions",
    label: "Ibibazo",
    icon: HelpCircle,
    exact: false,
  },
  {
    href: "/admin/certificates",
    label: "Ibyemezo",
    icon: Award,
    exact: false,
  },
  {
    href: "/dashboard",
    label: "Ahabanza",
    icon: ArrowLeft,
    exact: false,
  },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-cyan-400/20 bg-[#06121d]/95 px-2 backdrop-blur-lg md:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : link.href !== "/dashboard" && pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors",
              isActive
                ? "font-semibold text-amber-300"
                : "text-cyan-100/60 hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-amber-300" : "text-cyan-400/80")} />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
