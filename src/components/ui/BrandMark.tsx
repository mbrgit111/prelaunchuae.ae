/**
 * The PrelaunchUAE mark: three towers rising left to right, the tallest lit in amber with a spark
 * (public/brand/prelaunchuae-mark.svg, brand guidelines v1.0). "solid" is the mark itself: two towers in the current
 * text colour, the tallest in Launch Amber. "outline" draws the same towers as thin lines, for large decorative use behind
 * content on Ink or Sand bands. The tallest tower and the spark fade in once on load (pure CSS).
 */
export function BrandMark({ className = 'h-14 w-auto', variant = 'solid', animate = true }: {
  className?: string;
  /** Kept for call sites that pass one; the mark needs no ids. */
  id?: string;
  variant?: 'solid' | 'outline';
  animate?: boolean;
}) {
  const rise = animate ? 'plot-rise' : undefined;
  if (variant === 'outline') {
    return (
      <svg viewBox="-2 -2 51 60" className={className} aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
          <rect x="0" y="32" width="11" height="24" rx="2" />
          <rect x="18" y="20" width="11" height="36" rx="2" />
          <rect x="36" y="12" width="11" height="44" rx="2" />
          <path d="M41.5 0 44.5 5 41.5 10 38.5 5Z" />
        </g>
        <rect x="36" y="12" width="11" height="44" rx="2" fill="currentColor" opacity="0.35" className={rise} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 47 56" className={className} aria-hidden="true" focusable="false">
      <rect x="0" y="32" width="11" height="24" rx="2" fill="currentColor" />
      <rect x="18" y="20" width="11" height="36" rx="2" fill="currentColor" />
      <g className={rise}>
        <rect x="36" y="12" width="11" height="44" rx="2" fill="var(--nc-survey)" />
        <path d="M41.5 0 44.5 5 41.5 10 38.5 5Z" fill="var(--nc-survey)" />
      </g>
    </svg>
  );
}
