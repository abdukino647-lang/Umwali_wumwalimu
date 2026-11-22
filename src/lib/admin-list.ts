export const DEFAULT_ADMIN_EMAILS = [
  "jambopatrick456@gmail.com",
  "jambopa12@gmail.com",
  "abdukino647@gmail.com",
];

/**
 * Checks whether an email belongs to a designated administrator.
 * Supports hardcoded primary admins as well as comma-separated ADMIN_EMAILS env vars.
 */
export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();

  // Match full email or username
  const inDefault = DEFAULT_ADMIN_EMAILS.some(
    (adm) => clean === adm.toLowerCase() || clean === adm.split("@")[0].toLowerCase()
  );
  if (inDefault) return true;

  const envList = [
    process.env.ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .flatMap((s) => s!.split(","))
    .map((e) => e.trim().toLowerCase());

  return envList.includes(clean);
}
