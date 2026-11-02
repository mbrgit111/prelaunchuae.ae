'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Fades and lifts [data-reveal] elements into view (420 ms). Content is visible without JavaScript. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.setAttribute('data-in', ''));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
    );
    els.forEach((el) => {
      // Already on screen at load: show at once, so nothing above the fold waits for an animation.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.setAttribute('data-in', '');
        return;
      }
      el.setAttribute('data-armed', '');
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
