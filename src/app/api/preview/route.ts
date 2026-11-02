import { cookies, draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchContent } from '@/lib/content/client';
import { PREVIEW_COOKIE } from '@/lib/content';
import { PostDetailSchema } from '@/lib/content/types';

const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const PREVIEW_SECONDS = 30 * 60;

/**
 * /api/preview?token=...   The desk opens this from "Preview on website".
 * The token is checked with the content API (never cached). If it is good, Draft Mode is switched on for this browser
 * only, the token is kept in a short-lived cookie, and the visitor is sent to the article. Other visitors are not affected.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return new NextResponse('This preview link is not valid.', { status: 401, headers: noStore });

  const result = await fetchContent(`/preview/${encodeURIComponent(token)}`, PostDetailSchema, { preview: true });
  if (!result.ok) {
    return new NextResponse(result.status === 404 ? 'This preview link has expired. Open the preview again from the desk.' : 'The preview is not available right now.', {
      status: result.status === 404 ? 401 : 503,
      headers: noStore,
    });
  }

  (await draftMode()).enable();
  (await cookies()).set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PREVIEW_SECONDS,
  });
  // The address comes from the API payload for this post, never from the request.
  const path = result.data.path.startsWith('/') && !result.data.path.startsWith('//') ? result.data.path : '/';
  return NextResponse.redirect(new URL(path, request.url), { status: 307, headers: noStore });
}
