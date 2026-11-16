"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Award, Timer, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "Ahabanza",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/courses",
      label: "Amasomo",
      icon: BookOpen,
      active: pathname.startsWith("/courses"),
    },
    {
      href: "/exam",
      label: "Ikizamini",
      icon: Timer,
      active: pathname === "/exam",
    },
    {
      href: "/certificates",
      label: "Ibyemezo",
      icon: Award,
      active: pathname.startsWith("/certificates"),
    },
  ];

  if (isAdmin) {
    links.push({
      href: "/admin",
      label: "Admin",
      icon: Shield,
      active: pathname.startsWith("/admin"),
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-cyan-400/20 bg-[#06121d]/90 px-2 backdrop-blur-lg md:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-colors",
              link.active
                ? "font-semibold text-cyan-300"
                : "text-cyan-100/60 hover:text-white"
            )}
          >
            <Icon className={cn("h-5 w-5", link.active ? "text-cyan-300" : "text-cyan-100/50")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
