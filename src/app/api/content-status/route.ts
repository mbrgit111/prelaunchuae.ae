import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getContentStatus } from '@/lib/content';

const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

/**
 * Which source is the site using right now: the content API, the saved snapshot, or the older article files?
 * Open /api/content-status with the header  Authorization: Bearer <CONTENT_STATUS_TOKEN>.
 * With no token set in the environment this address does not exist.
 */
export async function GET(request: Request) {
  const token = process.env.CONTENT_STATUS_TOKEN;
  if (!token) return new NextResponse('Not found', { status: 404, headers: noStore });
  const given = Buffer.from((request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
  const wanted = Buffer.from(token);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return new NextResponse('Unauthorised', { status: 401, headers: noStore });
  return NextResponse.json(await getContentStatus(), { headers: noStore });
}
