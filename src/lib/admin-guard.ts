import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { isConfiguredAdminEmail } from "@/lib/admin-list";

/**
 * Checks the user's role fresh from the database (supporting UUID, email lookup, and configured admin list)
 * so that an admin logging in on any device (phone, tablet, computer) via any auth provider
 * is reliably identified and never locked out.
 */
export async function currentUserRole(): Promise<string | null> {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  const id = (user as { id?: string } | undefined)?.id;
  const email = user.email?.trim();
  const tokenRole = (user as { role?: string } | undefined)?.role;

  // 1. Designated admin check: auto-promotes in memory and synchronizes the DB
  if (isConfiguredAdminEmail(email)) {
    if (email) {
      db.update(users)
        .set({ role: "admin", isActive: true })
        .where(ilike(users.email, email))
        .catch(() => {});
    }
    return "admin";
  }

  // 2. Try finding by database UUID if id is a valid UUID
  const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    try {
      const r = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
      if (r[0]?.role) return r[0].role;
    } catch {
      // ignore and fallback to email
    }
  }

  // 3. Lookup by email in database (guaranteed unique and provider-agnostic)
  if (email) {
    try {
      const r = await db.select({ role: users.role }).from(users).where(ilike(users.email, email)).limit(1);
      if (r[0]?.role) return r[0].role;
    } catch {
      // ignore and fallback to token role
    }
  }

  // 4. Fallback to session token role
  return tokenRole ?? null;
}

export async function isAdmin(): Promise<boolean> {
  return (await currentUserRole()) === "admin";
}

/** Throw when the current user is not an admin — for guarding server actions. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("forbidden");
}
