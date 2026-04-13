import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/server/db';
import { prisma } from '@/lib/prisma';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role: 'admin' | 'manager' | 'user';
    } & DefaultSession['user'];
  }
  interface User {
    role: 'admin' | 'manager' | 'user';
  }
}

const nextAuth = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      id: 'otp',
      name: 'OTP Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const code = credentials?.code as string;
        if (!email || !code) return null;
        const otp = await prisma.oTP.findUnique({ where: { email } });
        if (!otp) return null;
        if (BigInt(Date.now()) > otp.expires) return null;
        if (otp.code !== code) return null;
        await prisma.oTP.delete({ where: { email } });
        return { id: email, email, role: 'user' as const };
      },
    }),
    Credentials({
      id: 'admin',
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        if (!username || !password) return null;
        const user = db.verifyLogin(username, password);
        if (user) {
          return {
            id: username,
            email: username,
            role: user.role as 'admin' | 'manager',
          };
        }
        return null;
      },
    }),
  ],
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
export const auth = nextAuth.auth;
export const GET = nextAuth.handlers.GET;
export const POST = nextAuth.handlers.POST;
