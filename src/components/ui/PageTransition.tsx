'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

let firstPaint = true;

/** Soft fade-and-rise when moving between pages. Skipped on the first load, so it never delays the first paint (LCP). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (firstPaint) {
      firstPaint = false;
      return;
    }
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
