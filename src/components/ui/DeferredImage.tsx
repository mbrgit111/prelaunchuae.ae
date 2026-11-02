'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * next/image that only starts loading when it comes within `margin` of the screen (the browser's own lazy loading
 * starts far earlier). The parent keeps the size, so nothing shifts. A <noscript> copy keeps it visible to crawlers.
 */
export function DeferredImage({ margin = '300px', ...props }: ImageProps & { margin?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  if (show) return <Image {...props} />;
  return (
    <>
      <span ref={ref} aria-hidden="true" className="absolute inset-0 block" />
      <noscript><Image {...props} /></noscript>
    </>
  );
}
