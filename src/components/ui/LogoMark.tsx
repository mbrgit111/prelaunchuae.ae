import type { MediaImage } from '@/data/types';

const frames = {
  strip: 'h-28 w-full p-3',
  card: 'size-16 shrink-0 p-1.5',
  feature: 'h-16 w-48 p-2',
  hero: 'h-24 w-52 p-2',
} as const;

/** The whole developer mark, inside the tile. Nothing is cropped. A faint file shows the name instead. */
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
  return (
    <span className={`flex items-center justify-center rounded-brand border border-line bg-white ${frames[frame]}`}>
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
          className="h-auto w-auto min-h-0 min-w-0 max-h-full max-w-full object-contain object-center"
        />
      ) : (
        <span className="line-clamp-3 text-center text-[11px] font-semibold leading-tight text-ink">{name}</span>
      )}
    </span>
  );
}
