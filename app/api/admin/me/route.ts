import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (!role || !['admin', 'manager'].includes(role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({ role });
}
