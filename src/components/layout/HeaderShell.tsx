'use client';

import { useEffect, useRef } from 'react';

/** Marks the header as scrolled once the page leaves the very top. One observer, no scroll listener. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const sentinel = document.getElementById('top-sentinel');
    const header = ref.current;
    if (!sentinel || !header || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => header.toggleAttribute('data-scrolled', !e!.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);
  return (
    <header ref={ref} className="site-header fixed inset-x-0 top-0 z-50 h-[72px] bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      {children}
    </header>
  );
}
