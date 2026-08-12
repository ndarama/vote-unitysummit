import { NextResponse } from 'next/server';

const TICKET_PROVIDER_URL = 'https://event.checkin.no/173420/unity-summit-2026';

export function GET() {
  return NextResponse.redirect(TICKET_PROVIDER_URL);
}
