'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const BAR_LINKS = 6;

// Bar links: Outfit 13px in body colour, gold on hover and on the current page, with a 2px gold line that grows from the left.
const BAR = 'relative whitespace-nowrap py-2 text-[13px] font-medium tracking-[0.02em] text-body transition-colors hover:text-gold aria-[current=page]:text-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100 aria-[current=page]:after:scale-x-100';

/** Main navigation with the current page marked. Also closes the phone menu after a link is followed. */
export function NavLinks({ items, variant }: { items: { label: string; href: string }[]; variant: 'bar' | 'menu' }) {
  const pathname = usePathname();
  const more = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    document.getElementById('site-menu')?.hidePopover?.();
    if (more.current) more.current.open = false;
  }, [pathname]);
  useEffect(() => {
    if (variant !== 'menu') return;
    const menu = document.getElementById('site-menu');
    const close = (e: MouseEvent) => {
      if ((e.target as Element).closest('a')) menu?.hidePopover?.();
    };
    menu?.addEventListener('click', close);
    return () => menu?.removeEventListener('click', close);
  }, [variant]);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  if (variant === 'menu') {
    return (
      <ul className="grid">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} aria-current={isCurrent(it.href) ? 'page' : undefined} className="group flex min-h-14 items-center justify-between gap-4 border-b border-line text-lg font-medium text-heading transition-colors hover:text-gold-hover aria-[current=page]:text-gold">
              {it.label}
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gold opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  // The bar shows the first six pages; the rest sit under "More" so all ten fit from 1024 px up (the phone menu lists every page).
  const shown = items.slice(0, BAR_LINKS);
  const rest = items.slice(BAR_LINKS);
  return (
    <ul className="flex items-center gap-5 xl:gap-7">
      {shown.map((it) => (
        <li key={it.href}>
          <Link href={it.href} aria-current={isCurrent(it.href) ? 'page' : undefined} className={BAR}>
            {it.label}
          </Link>
        </li>
      ))}
      {rest.length ? (
        <li className="relative">
          <details ref={more} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap py-2 text-[13px] font-medium tracking-[0.02em] text-body transition-colors hover:text-gold group-open:text-gold aria-[current=page]:text-gold [&::-webkit-details-marker]:hidden" aria-current={rest.some((it) => isCurrent(it.href)) ? 'page' : undefined}>
              More
              <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <ul className="absolute right-0 top-full z-50 mt-3 grid min-w-52 gap-0.5 border border-line border-t-2 border-t-gold bg-band p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]">
              {rest.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} aria-current={isCurrent(it.href) ? 'page' : undefined} className="flex min-h-11 items-center border-l-2 border-transparent px-3 text-[13px] text-body transition-colors hover:border-gold hover:bg-gold-tint hover:text-gold-hover aria-[current=page]:border-gold aria-[current=page]:text-gold">{it.label}</Link>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ) : null}
    </ul>
  );
}
