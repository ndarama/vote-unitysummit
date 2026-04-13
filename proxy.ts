import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const session = req.auth;
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  
  if (isAdmin && (!session || !['admin', 'manager'].includes(role ?? ''))) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
