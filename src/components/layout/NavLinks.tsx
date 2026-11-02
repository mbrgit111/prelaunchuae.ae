'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const BAR_LINKS = 6;

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
            <Link href={it.href} aria-current={isCurrent(it.href) ? 'page' : undefined} className="flex min-h-14 items-center border-b border-line text-xl font-medium aria-[current=page]:font-semibold">
              {it.label}
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
          <Link
            href={it.href}
            aria-current={isCurrent(it.href) ? 'page' : undefined}
            className="relative whitespace-nowrap py-2 text-[15px] text-ink transition-colors hover:text-survey-deep aria-[current=page]:font-semibold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-survey-deep after:transition-transform aria-[current=page]:after:scale-x-100"
          >
            {it.label}
          </Link>
        </li>
      ))}
      {rest.length ? (
        <li className="relative">
          <details ref={more} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap py-2 text-[15px] text-ink hover:text-survey-deep [&::-webkit-details-marker]:hidden" aria-current={rest.some((it) => isCurrent(it.href)) ? 'page' : undefined}>
              More
              <svg viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <ul className="absolute right-0 top-full z-50 mt-2 grid min-w-48 gap-0.5 rounded-brand border border-line bg-white p-2 shadow-[var(--nc-shadow-lift)]">
              {rest.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} aria-current={isCurrent(it.href) ? 'page' : undefined} className="flex min-h-11 items-center rounded-brand-sm px-3 text-[15px] hover:bg-sand aria-[current=page]:font-semibold">{it.label}</Link>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ) : null}
    </ul>
  );
}
