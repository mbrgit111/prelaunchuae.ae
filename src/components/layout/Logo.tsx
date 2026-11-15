import { config } from '@/site';

/**
 * Supplied logo files only (never re-typeset). Width and height set so nothing shifts while it loads.
 * The site is black + gold, so the reversed files (cream letters, gold tower) are the default; 'color' is for light grounds.
 * Reversed ones carry .logo-reverse, which the print styles turn black for white paper.
 */
export function Logo({ variant = 'horizontal', tone = 'reverse', width, className = '', lazy = false }: {
  variant?: 'horizontal' | 'compact' | 'stacked';
  tone?: 'color' | 'reverse';
  width: number;
  className?: string;
  lazy?: boolean;
}) {
  const l = config.logo;
  const rev = tone === 'reverse';
  const src = variant === 'horizontal' ? (rev ? l.horizontalReverse : l.horizontal) : variant === 'compact' ? (rev ? l.compactReverse : l.compact) : rev ? l.stackedReverse : l.stacked;
  const ratio = variant === 'horizontal' ? l.horizontalRatio : variant === 'compact' ? l.compactRatio : l.stackedRatio;
  // eslint-disable-next-line @next/next/no-img-element -- SVG logo: next/image adds nothing here
  return <img src={src} alt={config.name} width={width} height={Math.round(width / ratio)} className={rev ? `logo-reverse ${className}`.trim() : className} decoding="async" loading={lazy ? 'lazy' : undefined} />;
}
