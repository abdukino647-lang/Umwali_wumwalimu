"use client";

import { usePathname } from "next/navigation";
import { WHATSAPP_URL } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function FloatingWhatsApp() {
  const pathname = usePathname();

  // On pages with a fixed mobile bottom navigation bar (dashboard, courses, exam, certificates, admin),
  // raise it on small screens (bottom-20) so it cleanly clears the mobile nav bar.
  // On other pages (home, login, register, forgot-password), place it at bottom-5 right-5.
  const hasBottomNav =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/courses") ||
    pathname?.startsWith("/exam") ||
    pathname?.startsWith("/certificates") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/admin");

  return (
    <div
      className={`fixed ${
        hasBottomNav ? "bottom-20 right-4" : "bottom-5 right-5"
      } sm:bottom-6 sm:right-6 z-50 pointer-events-auto`}
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tuvugishe kuri WhatsApp"
        className="group relative flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
      >
        {/* Soft translucent green outer aura ring (matches official widget) */}
        <div className="flex items-center justify-center rounded-full bg-[#25D366]/20 p-2 sm:p-2.5 transition-colors group-hover:bg-[#25D366]/30">
          {/* Solid vibrant green WhatsApp circle button */}
          <div className="flex h-13 w-13 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-[#25D366] shadow-xl shadow-black/50 transition-colors group-hover:bg-[#20ba59] p-3 sm:p-3.5">
            <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
        </div>

        {/* Hover label for desktop */}
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-xl bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl border border-cyan-400/20 backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:inline-block">
          Tuvugishe kuri WhatsApp
        </span>
      </a>
    </div>
  );
}
