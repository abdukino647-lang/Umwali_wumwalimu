import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("DATABASE_URL=")) {
        return trimmed.replace(/^DATABASE_URL=/, "").replace(/^["']|["']$/g, "");
      }
    }
  }
  throw new Error("DATABASE_URL not found");
}

async function main() {
  const emailArg = process.argv[2];
  const newPasswordArg = process.argv[3];

  const url = getDatabaseUrl();
  const sql = neon(url);

  if (!emailArg || !newPasswordArg) {
    console.log("Listing all admin users in the database:");
    const admins = await sql`SELECT id, name, email, role FROM users WHERE role = 'admin'`;
    console.log(JSON.stringify(admins, null, 2));
    console.log("\nTo change/reset password for an admin, run:");
    console.log("npx tsx src/scripts/reset-admin-password.ts <email> <newPassword>\n");
    return;
  }

  const email = emailArg.trim().toLowerCase();
  const existing = await sql`SELECT id, name, email, role FROM users WHERE LOWER(email) = ${email}`;

  if (existing.length === 0) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(newPasswordArg, 10);
  await sql`UPDATE users SET password_hash = ${hash}, role = 'admin', is_active = true WHERE LOWER(email) = ${email}`;
  console.log(`SUCCESS: Password reset and admin role confirmed for: ${email}`);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
