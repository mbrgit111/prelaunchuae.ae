import Image from 'next/image';
import { preload } from 'react-dom';
import type { Media } from '@/lib/content/types';

type Variant = Media['variants'][number];

const byWidth = (a: Variant, b: Variant) => a.width - b.width;
const srcSet = (list: Variant[]) => list.map((v) => `${v.url} ${v.width}w`).join(', ');

/**
 * A picture from the desk, as a <picture>: AVIF where the browser can, then WebP, in the sizes the desk made.
 * The box has a fixed shape (no jump while loading) and a blurred stand-in colour behind the picture.
 * Server-rendered, no JavaScript. Pictures that are only a file path (older articles) use the normal Next.js image.
 */
export function CoverImage({
  media,
  alt,
  sizes,
  priority = false,
  aspect = '16 / 9',
  className = '',
}: {
  media: Media;
  /** Leave out for a decorative picture next to a link that already says what it is. */
  alt?: string;
  sizes: string;
  priority?: boolean;
  aspect?: string;
  className?: string;
}) {
  const text = alt ?? media.alt;
  const webp = media.variants.filter((v) => v.format === 'webp').sort(byWidth);
  const avif = media.variants.filter((v) => v.format === 'avif').sort(byWidth);
  const box = { aspectRatio: aspect, backgroundColor: media.dominantColor || undefined, backgroundImage: media.blurDataUrl ? `url("${media.blurDataUrl}")` : undefined, backgroundSize: 'cover' } as const;

  if (webp.length === 0 && avif.length === 0) {
    // A single address: a local file (older article) or one picture without sizes.
    const local = media.url.startsWith('/');
    return (
      <div className={`relative overflow-hidden ${className}`} style={box}>
        {local ? (
          <Image src={media.url} alt={text} fill sizes={sizes} priority={priority} className="object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- one https address with no sizes to choose from
          <img src={media.url} alt={text} loading={priority ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 size-full object-cover" />
        )}
      </div>
    );
  }

  const img = webp.length ? webp : avif;
  const biggest = img[img.length - 1]!;
  // The top picture is the biggest thing on the screen. Start fetching it (and open the connection to the picture store) from the page head, before the page body is read.
  if (priority) {
    const first = avif.length && webp.length ? avif : img;
    preload(first[first.length - 1]!.url, {
      as: 'image',
      imageSrcSet: srcSet(first),
      imageSizes: sizes,
      fetchPriority: 'high',
      type: first === avif ? 'image/avif' : `image/${first[0]!.format}`,
    });
  }
  return (
    <div className={`relative overflow-hidden ${className}`} style={box}>
      <picture>
        {avif.length && webp.length ? <source type="image/avif" srcSet={srcSet(avif)} sizes={sizes} /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- the desk already made the sizes; this is the <picture> fallback */}
        <img
          src={biggest.url}
          srcSet={srcSet(img)}
          sizes={sizes}
          alt={text}
          width={media.width || biggest.width}
          height={media.height || Math.round(biggest.width * 0.5625)}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          className="absolute inset-0 size-full object-cover"
        />
      </picture>
    </div>
  );
}
