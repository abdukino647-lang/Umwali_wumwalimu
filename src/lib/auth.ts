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

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users as any,
  accountsTable: accounts as any,
}) as any;

const safeAdapter: any = {
  ...baseAdapter,
  async getUserByEmail(email: string) {
    try {
      if (!email) return null;
      const res = await db
        .select()
        .from(users)
        .where(ilike(users.email, email.trim()))
        .limit(1);
      return res[0] || null;
    } catch (e) {
      console.warn("getUserByEmail warning:", e);
      return await baseAdapter.getUserByEmail(email);
    }
  },
  async getUser(id: string) {
    try {
      if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        const res = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (res[0]) return res[0];
      }
      return null;
    } catch (e) {
      console.warn("getUser warning:", e);
      return null;
    }
  },
  async getUserByAccount(account: any) {
    try {
      return await baseAdapter.getUserByAccount(account);
    } catch (e) {
      console.warn("getUserByAccount warning (falling back):", e);
      return null;
    }
  },
  async linkAccount(account: any) {
    try {
      return await baseAdapter.linkAccount(account);
    } catch (e) {
      console.warn("linkAccount warning (continuing without link):", e);
      return undefined;
    }
  },
  async createUser(data: any) {
    try {
      const trialDays = await getDefaultTrialDays().catch(() => 2);
      const accessExpiresAt = new Date(Date.now() + trialDays * 86_400_000);
      const safeName = data.name || data.email?.split('@')[0] || 'Umunyeshuri';

      const [newUser] = await db
        .insert(users)
        .values({
          name: safeName,
          email: data.email,
          avatarUrl: data.image || null,
          role: 'student',
          isActive: true,
          accessExpiresAt,
        } as any)
        .returning();

      return newUser || (await baseAdapter.createUser(data));
    } catch (e) {
      console.error("createUser fallback warning:", e);
      return await baseAdapter.createUser(data);
    }
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: safeAdapter,
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
