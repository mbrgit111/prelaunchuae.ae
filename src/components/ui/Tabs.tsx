'use client';

import { useId, useRef, useState } from 'react';

/** WAI-ARIA tabs. Every panel is in the HTML (search engines read them all); only the chosen one is shown. */
export function Tabs({ labels, panels, ariaLabel }: { labels: string[]; panels: React.ReactNode[]; ariaLabel: string }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number) => {
    const next = (i + labels.length) % labels.length;
    setActive(next);
    refs.current[next]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {labels.map((l, i) => (
          <button
            key={l}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${uid}-t${i}`}
            role="tab"
            type="button"
            aria-selected={active === i}
            aria-controls={`${uid}-p${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(i + 1);
              if (e.key === 'ArrowLeft') move(i - 1);
              if (e.key === 'Home') move(0);
              if (e.key === 'End') move(labels.length - 1);
            }}
            className="min-h-11 shrink-0 rounded-brand border border-line bg-white px-4 text-[15px] font-semibold text-ink transition-colors hover:border-ink aria-selected:border-ink aria-selected:bg-datum aria-selected:text-white"
          >
            {l}
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div key={i} id={`${uid}-p${i}`} role="tabpanel" aria-labelledby={`${uid}-t${i}`} hidden={active !== i} tabIndex={0} className="mt-6 focus-visible:outline-offset-4">
          {p}
        </div>
      ))}
    </div>
  );
}
