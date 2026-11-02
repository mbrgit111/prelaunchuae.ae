'use client';

import { useEffect, useRef } from 'react';

/** Counts up to a number taken from the data once it scrolls into view. The real number is in the HTML from the start. */
export function Counter({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 900);
          el.textContent = Math.round(value * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US');
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref} className={`tabular-nums ${className}`}>{value.toLocaleString('en-US')}</span>;
}
