import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDefaultTrialDays } from '@/lib/access';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
  }) as any,
  events: {
    async createUser({ user }) {
      if (user.id) {
        try {
          const trialDays = await getDefaultTrialDays();
          const accessExpiresAt = new Date(Date.now() + trialDays * 86_400_000);
          await db
            .update(users)
            .set({ accessExpiresAt, role: 'student', isActive: true })
            .where(eq(users.id, user.id));
        } catch (e) {
          console.error("Failed to set trial for new OAuth user:", e);
        }
      }
    },
  },
  providers: [
    ...authConfig.providers,
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.RESEND_FROM || 'noreply@amategeko.rw',
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim();
        const userResult = await db.select().from(users).where(ilike(users.email, email)).limit(1);
        const user = userResult[0];

        if (!user || !user.passwordHash) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isPasswordValid) return null;

        return user;
      }
    }),
  ],
});
