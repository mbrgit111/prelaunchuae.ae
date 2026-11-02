/** Reads the JSON files from data/ and runs the checks. Used by the site (through index.ts) and by `npm run check:data`. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { normalise } from './normalise.ts';
import type { SiteData } from './types.ts';

/**
 * The REM pictures the MBR API has ready (the catalogue's `media`, asked for with ?media=1), as picture-list entries.
 * Each address is the picture's largest saved width; the other widths saved follow `#w=`, for the image loader.
 */
export function storedPictures(pictures: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!pictures || typeof pictures !== 'object') return out;
  for (const [url, value] of Object.entries(pictures as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const p = value as { src?: unknown; width?: unknown; height?: unknown; kind?: unknown; widths?: unknown; weak?: unknown };
    if (typeof p.src !== 'string' || !p.src.startsWith('https://')) continue;
    if (!Number.isInteger(p.width) || !Number.isInteger(p.height) || (p.width as number) <= 0 || (p.height as number) <= 0) continue;
    const widths = Array.isArray(p.widths) ? p.widths.filter((w): w is number => Number.isInteger(w) && (w as number) > 0) : [];
    out[url] = {
      src: widths.length ? `${p.src}#w=${widths.join(',')}` : p.src,
      width: p.width,
      height: p.height,
      kind: typeof p.kind === 'string' ? p.kind : 'picture',
      ...(p.weak === true ? { weak: true } : {}),
    };
  }
  return out;
}

export function loadSiteData(opts: { scope: 'dubai-south-only' | 'all'; communityName: string; alsoDistricts?: string[]; renameAreas?: Record<string, string>; dir?: string; publish?: (slug: string) => boolean; detail?: unknown; list?: unknown; manifest?: unknown; unavailable?: unknown; pictures?: unknown }): SiteData {
  // Paths stay inside data/ so the server bundle only ever includes those files (never public/ or the pictures).
  const locate = (file: string) => (opts.dir ? path.join(/*turbopackIgnore: true*/ opts.dir, file) : path.join(process.cwd(), 'data', file));
  const read = (file: string, optional = false): unknown => {
    const full = locate(file);
    if (!existsSync(full)) {
      if (optional) return null;
      throw new Error(`Missing data file: data/${file}`);
    }
    try {
      return JSON.parse(readFileSync(full, 'utf8'));
    } catch (e) {
      throw new Error(`data/${file} is not valid JSON: ${(e as Error).message}`);
    }
  };
  return normalise({
    detail: opts.detail ?? read('remapp-projects.json'),
    list: opts.list ?? read('remapp-projects-list.json'),
    // Pictures saved with the site at build time, and over them the ones the MBR API has ready now (no rebuild needed).
    manifest: { ...(((opts.manifest ?? read('media-manifest.json', true)) as Record<string, unknown> | null) ?? {}), ...storedPictures(opts.pictures) },
    unavailable: opts.unavailable ?? read('media-unavailable.json', true) ?? [],
    posts: read('posts.json', true) ?? [],
    scope: opts.scope,
    communityName: opts.communityName,
    alsoDistricts: opts.alsoDistricts,
    renameAreas: opts.renameAreas,
    publish: opts.publish,
  });
}
