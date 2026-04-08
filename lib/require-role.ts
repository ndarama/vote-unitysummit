import { auth } from '@/auth';

type AdminRole = 'admin' | 'manager';

export async function requireRole(roles: AdminRole[]): Promise<AdminRole | null> {
  const session = await auth();
  const role = (session?.user as any)?.role as AdminRole | undefined;
  if (!role || !roles.includes(role)) return null;
  return role;
}
