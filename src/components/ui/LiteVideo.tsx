'use client';

import { useState } from 'react';

/** Click-to-load YouTube video: no iframe or YouTube script until the visitor presses play. */
export function LiteVideo({ title, youtubeId }: { title: string; youtubeId: string }) {
  const [play, setPlay] = useState(false);
  if (play) {
    return (
      <div className="relative aspect-video overflow-hidden border border-line bg-band">
        <iframe className="absolute inset-0 size-full" src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`} title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setPlay(true)} aria-label={`Play video: ${title}`} className="group relative grid aspect-video w-full place-items-center overflow-hidden border border-line bg-band transition-colors hover:border-line-strong">
      <span aria-hidden="true" className="gold-grid grid-fade absolute inset-0" />
      <span className="relative grid size-16 place-items-center bg-gold text-on-gold transition-colors group-hover:bg-gold-hover">
        <svg viewBox="0 0 24 24" className="ml-1 size-6" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
      </span>
    </button>
  );
}
