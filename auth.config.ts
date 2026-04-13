export const authConfig = {
  pages: {
    signIn: '/',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const session = auth;
      const role = (session?.user as any)?.role as string | undefined;
      const isAdmin = nextUrl.pathname.startsWith('/admin');
      if (isAdmin) {
        return !!session && ['admin', 'manager'].includes(role ?? '');
      }
      return true;
    },
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
  providers: [],
};
