import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

// Block requests carrying Next-Action headers. This app has no server actions;
// all forms use fetch + API routes. These requests come exclusively from bots
// probing for Next.js server action endpoints.
function blockServerActionProbes(req: NextRequest): NextResponse | null {
  if (req.headers.has('next-action')) {
    return new NextResponse(null, { status: 400 });
  }
  return null;
}

export default auth((req) => {
  const blocked = blockServerActionProbes(req);
  if (blocked) return blocked;

  const session = req.auth;
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  
  if (isAdmin && (!session || !['admin', 'manager'].includes(role ?? ''))) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
