/**
 * next/image loader for every picture on the site.
 * - Pictures made by scripts/sync-images.mjs: covers exist as a large file and a small "-sm" copy; this picks the
 *   small one for card widths. Plain static files, so no image service runs per visit.
 * - REM pictures prepared by the MBR API in its picture storage: the address of the largest saved width, ending in
 *   `/<width>.webp`, followed by `#w=` and every width saved (added in data/read.ts). This picks the saved width at or
 *   just above the one asked for. Nothing after `#` is ever sent to the storage.
 * Any other address is used as it is.
 */
const SMALL: Record<string, number> = { cover: 828 };
const LOCAL = /^\/media\/(cover)\/[0-9a-f]{16}\.webp$/;
const STORED = /^(https:\/\/[^#]+\/)(\d+)\.webp#w=([\d,]+)$/;

/** The picture's own address without the list of widths: for share images, Google data and anything outside next/image. */
export const pictureUrl = (src: string) => src.replace(/#.*$/, '');

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const stored = STORED.exec(src);
  if (stored) {
    const widths = stored[3]!.split(',').map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    return `${stored[1]}${widths.find((w) => w >= width) ?? widths.at(-1) ?? Number(stored[2])}.webp`;
  }
  const kind = LOCAL.exec(src)?.[1];
  if (kind && width <= SMALL[kind]!) return src.replace(/\.webp$/, '-sm.webp');
  return pictureUrl(src);
}
