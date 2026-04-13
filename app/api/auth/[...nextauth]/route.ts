import { handlers } from '@/auth';

export async function GET(...args: Parameters<typeof handlers.GET>) {
  return handlers.GET(...args);
}

export async function POST(...args: Parameters<typeof handlers.POST>) {
  return handlers.POST(...args);
}
