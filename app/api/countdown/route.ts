import { db } from '@/server/db';

export async function GET() {
  const config = await db.getCountdown();
  if (!config) return Response.json(null, { status: 200 });
  return Response.json(config);
}
