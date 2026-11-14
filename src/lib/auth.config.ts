import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

// Edge-safe config shared by the main auth instance (Node) and the middleware
// (Edge). It must NOT import the DB adapter, bcrypt, or any Node-only code —
// those live in auth.ts. Sharing this config lets the middleware decode the
// session cookie exactly the way auth.ts encoded it.
const googleClientId =
  process.env.GOOGLE_ID ||
  process.env.AUTH_GOOGLE_ID ||
  process.env.Client_ID ||
  process.env.CLIENT_ID;

const googleClientSecret =
  process.env.GOOGLE_SECRET ||
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.Client_secret ||
  process.env.CLIENT_SECRET;

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role || 'student';
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
