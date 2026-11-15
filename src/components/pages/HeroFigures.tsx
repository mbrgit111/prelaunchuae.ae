const COLS = { 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' } as const;

/**
 * A row of figures for an inner-page hero: square surface cells, a gold figure over a muted micro label.
 * Figures come from the data (siteStats, the area, the list) and are never typed in.
 */
export function HeroFigures({ items, className = '' }: { items: [React.ReactNode, string][]; className?: string }) {
  return (
    <dl className={`mt-2 grid max-w-3xl grid-cols-2 gap-2 ${COLS[items.length === 3 ? 3 : 4]} ${className}`}>
      {items.map(([n, l]) => (
        <div key={l} className="flex flex-col-reverse justify-end gap-1.5 border border-line bg-surface/80 p-4">
          <dt className="text-[11px] font-bold uppercase leading-4 tracking-label text-muted">{l}</dt>
          <dd className="text-figure whitespace-nowrap text-[26px] leading-none text-gold md:text-[30px]">{n}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Short price for a figure cell: AED 1.25M / AED 850K. */
export const shortAed = (n: number | null) => (n ? (n >= 1e6 ? `${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M` : `${Math.round(n / 1000)}K`) : '—');
