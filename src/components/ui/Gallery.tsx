'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DeferredImage } from './DeferredImage';
import { Icon } from './Icon';

export interface GalleryItem {
  src: string;
  width: number;
  height: number;
  alt: string;
  group: string;
}

const FIRST = 8;

/** Picture grid with group tabs and a full-screen viewer (native <dialog>: Esc closes, arrow keys move). */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const groups = useMemo(() => [...new Set(items.map((i) => i.group))], [items]);
  const [group, setGroup] = useState('All');
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = group === 'All' ? items : items.filter((i) => i.group === group);
  const shown = expanded ? list : list.slice(0, FIRST);
  const current = open != null ? list[open] : null;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open != null && !d.open) d.showModal();
    if (open == null && d.open) d.close();
  }, [open]);

  const step = (by: number) => setOpen((i) => (i == null ? i : (i + by + list.length) % list.length));

  return (
    <div className="grid gap-6">
      {groups.length > 1 ? (
        <div role="group" aria-label="Picture groups" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {['All', ...groups].map((g) => {
            const n = g === 'All' ? items.length : items.filter((i) => i.group === g).length;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => {
                  setGroup(g);
                  setExpanded(false);
                }}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-line-strong bg-surface px-4 text-sm font-semibold text-body transition-colors hover:border-gold hover:text-heading aria-pressed:border-gold aria-pressed:bg-gold aria-pressed:text-on-gold"
              >
                {g}
                <span className="tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((img, i) => (
          <li key={img.src}>
            <button type="button" onClick={() => setOpen(i)} className="group relative block aspect-[4/3] w-full overflow-hidden border border-line bg-surface transition-colors hover:border-gold" aria-label={`Open picture ${i + 1} of ${list.length}: ${img.alt}`}>
              <DeferredImage src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 300px, (min-width: 768px) 33vw, 50vw" className={`${img.group === 'Floor plans' ? 'bg-white object-contain p-2' : 'object-cover'} transition-transform duration-300 group-hover:scale-[1.03]`} />
            </button>
          </li>
        ))}
      </ul>
      {list.length > FIRST ? (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="btn btn-secondary justify-self-start">
          {expanded ? 'Show fewer pictures' : `Show all ${list.length} pictures`}
        </button>
      ) : null}
      <dialog
        ref={dialog}
        aria-label="Picture viewer"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        className="m-auto w-[min(1100px,94vw)] overflow-visible bg-transparent p-0 text-white backdrop:bg-page/90"
      >
        {current ? (
          <div className="grid gap-3">
            <div className="relative aspect-[16/10] overflow-hidden border border-line border-t-2 border-t-gold bg-band">
              <Image key={current.src} src={current.src} alt={current.alt} fill sizes="94vw" className={current.group === 'Floor plans' ? 'bg-white object-contain p-4' : 'object-contain'} />
            </div>
            <div className="on-dark flex items-center justify-between gap-4">
              <p className="text-sm tabular-nums text-body">{open! + 1} / {list.length} · {current.group}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => step(-1)} className="btn btn-outline-plot btn-icon" aria-label="Previous picture"><Icon name="arrow-right" className="size-5 rotate-180" /></button>
                <button type="button" onClick={() => step(1)} className="btn btn-outline-plot btn-icon" aria-label="Next picture"><Icon name="arrow-right" className="size-5" /></button>
                <button type="button" onClick={() => setOpen(null)} className="btn btn-primary btn-icon" aria-label="Close viewer"><Icon name="close" className="size-5" /></button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
