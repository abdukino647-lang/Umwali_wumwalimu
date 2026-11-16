import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { isConfiguredAdminEmail } from '@/lib/admin-list';

// Edge-safe config shared by the main auth instance (Node) and the middleware
// (Edge). It must NOT import the DB adapter, bcrypt, or any Node-only code —
// those live in auth.ts. Sharing this config lets the middleware decode the
// session cookie exactly the way auth.ts encoded it.
const googleClientId =
  process.env.GOOGLE_ID ||
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.Client_ID ||
  process.env.CLIENT_ID;

const googleClientSecret =
  process.env.GOOGLE_SECRET ||
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.Client_secret ||
  process.env.CLIENT_SECRET;

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name || profile.given_name || profile.email?.split('@')[0] || 'Umunyeshuri',
                email: profile.email,
                image: profile.picture,
              };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    signIn: async () => {
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role || token.role || 'student';
        token.id = user.id || token.sub || token.id;
      }
      if (isConfiguredAdminEmail(token.email as string)) {
        token.role = 'admin';
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token) {
        const isAdmin = isConfiguredAdminEmail(session.user.email) || token.role === 'admin';
        (session.user as any).role = isAdmin ? 'admin' : (token.role as string) || 'student';
        (session.user as any).id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
