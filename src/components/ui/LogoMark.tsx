import type { MediaImage } from '@/data/types';
import { ON_DARK } from './logo-tones';

const frames = {
  strip: 'h-28 w-full p-3',
  card: 'size-16 shrink-0 p-1.5',
  feature: 'h-16 w-48 p-2',
  hero: 'h-24 w-52 p-2',
} as const;

/** File id of a logo: /media/logo/<id>.webp when stored here, or the first 16 characters of <hash> in the picture service's
 * …/rem/1/<hash>/logo.webp (the same file, read at runtime). */
const fileId = (src: string) => {
  const m = src.match(/\/([0-9a-f]{16,})\/logo\.[a-z]+$/);
  return m?.[1] ? m[1].slice(0, 16) : src.slice(src.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
};

/**
 * The whole developer mark, inside the tile, in its own colours. Nothing is cropped. A faint file shows the name instead.
 * Light marks and files on their own dark plate sit on the dark tile; every other logo on a white tile (logo-tones.ts).
 */
export function LogoMark({
  logo,
  name,
  frame,
  labelled = true,
}: {
  logo: MediaImage | null;
  name: string;
  frame: keyof typeof frames;
  labelled?: boolean;
}) {
  const readable = Boolean(logo && !logo.weak);
  const id = readable ? fileId(logo!.src) : '';
  const light = readable && !ON_DARK.has(id);
  return (
    <span className={`flex items-center justify-center rounded-brand border border-line ${light ? 'bg-white' : 'bg-surface'} ${frames[frame]}`}>
      {readable ? (
        <img
          src={logo!.src}
          alt={labelled ? logo!.alt : ''}
          width={logo!.width}
          height={logo!.height}
          // Logos sit well below the first screen (home page: about 8,000 px down), so they load when scrolled to. Only the
          // developer's own page, where the logo is in the header, loads it straight away. Width and height are set: no layout shift.
          loading={frame === 'hero' ? 'eager' : 'lazy'}
          decoding="async"
          className={`${light ? '' : 'logo-on-dark '}h-auto w-auto min-h-0 min-w-0 max-h-full max-w-full object-contain object-center`}
        />
      ) : (
        <span className="line-clamp-3 text-center text-[11px] font-semibold leading-tight text-ink">{name}</span>
      )}
    </span>
  );
}
