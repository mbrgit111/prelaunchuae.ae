/**
 * Reads the MBR content API from the server. Nothing here runs in the browser and the site key never leaves the server.
 *
 * Caching: every call is cached by Next.js and tagged, so the desk refreshes one post (post:<slug>) or every list
 * (posts:<site>) the moment something is published, changed or taken down (scheduled posts too). Between refreshes
 * visitors get the saved page. Kept a day at the most, so the project pages that show articles stay cached as long as
 * their projects (data/index.ts) instead of being made again every ten minutes.
 */
import 'server-only';
import { config } from '@/site';
import type { z } from 'zod';

export const REVALIDATE_SECONDS = 86_400;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

import { apiSettings } from './settings';
export { apiSettings };

export const listTag = () => `posts:${config.contentKey}`;
export const postTag = (slug: string) => `post:${slug}`;

export type FetchOptions = { tags?: string[]; preview?: boolean };

/**
 * One GET against /v1/public<path>. Never throws: a missing post is { status: 404 }, anything else that goes wrong
 * (not set up, unreachable, slow, error, unexpected shape) is { status: 0 } so the caller can use its fallback.
 */
export async function fetchContent<S extends z.ZodType>(path: string, schema: S, options: FetchOptions = {}): Promise<ApiResult<z.output<S>>> {
  const { url, key } = apiSettings();
  if (!url || !key) return { ok: false, status: 0, reason: 'not_configured' };
  try {
    const res = await fetch(`${url}/v1/public${path}`, {
      headers: { 'X-Site-Key': key, Accept: 'application/json' },
      ...(options.preview
        ? { cache: 'no-store' as const }
        : { next: { revalidate: REVALIDATE_SECONDS, tags: ['posts', listTag(), ...(options.tags ?? [])] } }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return { ok: false, status: 404, reason: 'not_found' };
    if (!res.ok) return { ok: false, status: 0, reason: `http_${res.status}` };
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) return { ok: false, status: 0, reason: 'unexpected_shape' };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, status: 0, reason: 'unreachable' };
  }
}
