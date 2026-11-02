import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { cleanRefreshTargets, verifyRefresh } from '@/lib/content/signature';
import { forgetCatalogue } from '@/data';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * The MBR desk calls this when a post goes live, changes or is taken down.
 * The call is signed with a secret both sides know (REVALIDATE_SECRET) and expires after five minutes.
 * Anything unsigned, tampered with or old is refused before any page is touched.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const check = verifyRefresh({
    secret: process.env.REVALIDATE_SECRET,
    timestamp: request.headers.get('x-mbr-timestamp') ?? '',
    signature: request.headers.get('x-mbr-signature') ?? '',
    body,
  });
  if (!check.ok) {
    const status = check.reason === 'not_configured' ? 503 : 401;
    return NextResponse.json({ ok: false, error: check.reason === 'not_configured' ? 'not_configured' : 'unauthorised' }, { status, headers: noStore });
  }

  let payload: { event?: unknown; paths?: unknown; tags?: unknown };
  try {
    payload = JSON.parse(body) as { event?: unknown; paths?: unknown; tags?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400, headers: noStore });
  }
  const { paths, tags } = cleanRefreshTargets(payload);

  // Data first, so the next visit fetches fresh content, then the pages themselves.
  // The project list changed (the daily update, a desk edit, new pictures): every page that shows projects is made
  // again on its next visit, in the background, while visitors keep getting the current page. Each page checks the
  // list's version first, so it is made from the new list.
  if (payload.event === 'catalogue.updated') {
    forgetCatalogue();
    for (const tag of tags) revalidateTag(tag, 'max');
    return NextResponse.json({ ok: true, paths: 0, tags: tags.length }, { headers: noStore });
  }
  // An article went live, changed or was taken down: data first, so the next visit fetches fresh content, then the pages.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path);
  return NextResponse.json({ ok: true, paths: paths.length, tags: tags.length }, { headers: noStore });
}
