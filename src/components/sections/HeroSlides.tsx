'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface HeroCaption {
  slug: string;
  name: string;
  place: string;
}

type Img = React.ImgHTMLAttributes<HTMLImageElement>;

/** How long the outgoing picture stays underneath the incoming one (the CSS fade is 900 ms). */
const FADE_MS = 900;
const TICK_MS = 100;
const pad = (n: number) => String(n).padStart(2, '0');

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={`size-[18px] ${flip ? 'rotate-180' : ''}`}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </svg>
);

/**
 * The home picture and its thumbnail rail: a new launch every few seconds, cross-fading. The first picture is rendered on the
 * server (`first`) and preloaded; the other pictures and every thumbnail (plain <img> props from getImageProps) are added only
 * after the page has finished loading, so they never compete with it. The caption is a real link to the project. The picture
 * stops while a mouse is over it, while keyboard focus is inside it or in the search form (#hero-finder), and while the tab is
 * hidden; the button stops it for good. Visitors who asked for reduced motion start paused and see no fade and no moving bar.
 */
export function HeroSlides({ first, rest, thumbs, captions, intervalMs = 4500 }: { first: React.ReactNode; rest: Img[]; thumbs: Img[]; captions: HeroCaption[]; intervalMs?: number }) {
  const total = captions.length;
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [finder, setFinder] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [said, setSaid] = useState('');
  const loaded = useRef(new Set<number>([0]));
  const failed = useRef(new Set<number>());
  const shownFor = useRef(0); // ms the picture on show has been looked at (it keeps counting only while the slider runs)
  const current = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    // Typing in the search must not have the picture change under the eyes.
    const form = document.getElementById('hero-finder');
    const into = () => setFinder(true);
    const out = (e: FocusEvent) => {
      if (!form?.contains(e.relatedTarget as Node | null)) setFinder(false);
    };
    form?.addEventListener('focusin', into);
    form?.addEventListener('focusout', out);
    let timer: number | undefined;
    const start = () => {
      timer = window.setTimeout(() => setReady(true), 700);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', start);
      document.removeEventListener('visibilitychange', visibility);
      form?.removeEventListener('focusin', into);
      form?.removeEventListener('focusout', out);
    };
  }, []);

  const go = useCallback(
    (n: number, byHand: boolean) => {
      if (n === current.current) return;
      setPrev(current.current);
      current.current = n;
      shownFor.current = 0;
      setIndex(n);
      // Said aloud only when the visitor changed it; a picture that changes by itself stays quiet.
      setSaid(byHand ? `Showing ${captions[n]!.name}, ${captions[n]!.place}, ${n + 1} of ${total}` : '');
    },
    [captions, total],
  );

  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), FADE_MS + 100);
    return () => window.clearTimeout(id);
  }, [prev]);

  const running = ready && total > 1 && !paused && !hover && !focused && !finder && !hidden;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      shownFor.current += TICK_MS;
      if (shownFor.current < intervalMs) return;
      // The next picture that has arrived. One still on its way is waited for, not skipped; one that failed is skipped.
      for (let k = 1; k < total; k++) {
        const next = (current.current + k) % total;
        if (loaded.current.has(next)) return go(next, false);
        if (!failed.current.has(next)) return;
      }
      shownFor.current = 0;
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, intervalMs, total, go]);

  const caption = captions[index] ?? captions[0]!;
  const slide = (k: number) => ({ 'data-active': index === k || undefined, 'data-prev': prev === k || undefined, 'aria-hidden': index !== k, role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${k + 1} of ${total}` }) as const;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured new launches"
      data-running={running || undefined}
      className="hero-stage"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
      onFocus={(e) => {
        try {
          if (e.target.matches(':focus-visible')) setFocused(true);
        } catch {
          setFocused(true);
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="hero-frame-wrap">
        <div className="hero-frame">
          <div className="hero-slides">
            <div className="hero-slide" {...slide(0)}>{first}</div>
            {ready
              ? rest.map((props, k) => (
                  <div key={k} className="hero-slide" {...slide(k + 1)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- the props come from next/image's getImageProps */}
                    <img
                      {...props}
                      alt={index === k + 1 ? props.alt : ''}
                      ref={(el) => {
                        if (el?.complete) (el.naturalWidth > 0 ? loaded : failed).current.add(k + 1);
                      }}
                      onLoad={() => loaded.current.add(k + 1)}
                      onError={() => failed.current.add(k + 1)}
                    />
                  </div>
                ))
              : null}
          </div>
          <span aria-hidden="true" className="hero-shade" />
          <span className="hero-tag">Developer render</span>
          <Link href={`/projects/${caption.slug}`} className="hero-cap" title={`${caption.name}, ${caption.place}`}>
            <span className="hero-cap-text">{caption.name}, {caption.place}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className="size-4 shrink-0"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
          </Link>
        </div>

        {total > 1 ? (
          <div className="hero-ctl">
            <span aria-hidden="true" className="hero-count"><b>{pad(index + 1)}</b> / {pad(total)}</span>
            <button type="button" className="hero-btn hero-btn-step" disabled={!ready} aria-label="Previous project" onClick={() => go((index + total - 1) % total, true)}><Arrow flip /></button>
            <button type="button" className="hero-btn hero-btn-step" disabled={!ready} aria-label="Next project" onClick={() => go((index + 1) % total, true)}><Arrow /></button>
            <button type="button" className="hero-btn" aria-label={paused ? 'Play the slideshow' : 'Pause the slideshow'} title={paused ? 'Play the slideshow' : 'Pause the slideshow'} onClick={() => setPaused((p) => !p)}>
              {paused ? (
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-4"><path d="M4 2.4v11.2a.8.8 0 0 0 1.2.7l9-5.6a.8.8 0 0 0 0-1.4l-9-5.6A.8.8 0 0 0 4 2.4z" /></svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-4"><rect x="3" y="2" width="3.4" height="12" /><rect x="9.6" y="2" width="3.4" height="12" /></svg>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <ol className="hero-rail" aria-label="Choose a project" style={{ '--hero-n': total } as React.CSSProperties}>
          {captions.map((c, k) => (
            <li key={c.slug}>
              <button type="button" className="hero-rail-item" aria-current={k === index ? 'true' : undefined} aria-label={`Show ${c.name}, ${c.place} (${k + 1} of ${total})`} title={`${c.name}, ${c.place}`} disabled={!ready} onClick={() => go(k, true)}>
                <span className="hero-thumb">
                  {ready && thumbs[k] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the props come from next/image's getImageProps
                    <img {...thumbs[k]} alt="" />
                  ) : null}
                  <span aria-hidden="true" className="hero-num">{pad(k + 1)}</span>
                </span>
                <span aria-hidden="true" className="hero-bar"><i /></span>
                <span className="hero-name">{c.name}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{said}</p>
    </section>
  );
}
