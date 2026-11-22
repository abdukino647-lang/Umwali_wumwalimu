import React from "react";

/**
 * Authentic WhatsApp icon matching the official widget:
 * White speech bubble outline with tail, and white telephone handset inside.
 */
export function WhatsAppIcon({
  className = "h-8 w-8",
  colored,
}: {
  className?: string;
  colored?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Speech bubble outline with tail */}
      <path
        d="M16 3C8.82 3 3 8.82 3 16c0 2.54.73 4.91 2 6.92L3.5 28.5l5.78-1.47A12.9 12.9 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3z"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Telephone handset */}
      <path
        d="M21.5 19.3c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"
        fill="white"
      />
    </svg>
  );
}
