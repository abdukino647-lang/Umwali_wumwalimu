"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Instant client-side "go back" (gusubira inyuma).
// - `to` forces a fixed destination (always go there).
// - otherwise go to the previous page, falling back to `fallback`.
export function BackButton({
  label = "Gusubira inyuma",
  fallback = "/",
  to,
  className = "",
}: {
  label?: string;
  fallback?: string;
  to?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (to) {
          router.push(to);
        } else if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-400/25 bg-white/5 px-3 py-1.5 text-xs sm:text-sm text-cyan-100/85 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
