import { cookies, draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { PREVIEW_COOKIE } from '@/lib/content';

/** Leaves preview. A POST (from the banner button) because it changes cookies. */
export async function POST(request: Request) {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_COOKIE);
  return NextResponse.redirect(new URL('/', request.url), { status: 303, headers: { 'Cache-Control': 'no-store' } });
}
