type Tone = 'white' | 'sand' | 'tint' | 'dark' | 'page' | 'band' | 'warm';
// All dark: page (#0A0A0A) and band (#0F0F0F) alternate; gold tint ("tint") for soft emphasis; the warm gold-black band
// ("dark" / "warm") is for the one or two "moment" bands of a page (register, golden visa), with soft gold glows in its corners.
const tones: Record<Tone, string> = {
  white: 'on-white bg-page',
  page: 'on-white bg-page',
  sand: 'on-sand bg-band',
  band: 'on-sand bg-band',
  tint: 'on-tint bg-gold-tint',
  dark: 'on-dark warm-band text-body',
  warm: 'on-dark warm-band text-body',
};

export const slugId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** The one gold word of a headline: wraps the first match of `word` in <em class="text-strong">. Plain text when it is not found. */
export function withHighlight(title: string, word?: string): React.ReactNode {
  if (!word) return title;
  const at = title.toLowerCase().indexOf(word.toLowerCase());
  if (at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <em className="text-strong">{title.slice(at, at + word.length)}</em>
      {title.slice(at + word.length)}
    </>
  );
}

/** Gold micro label: between two hairlines (centred), after one hairline (left), or as the square pill with the pulsing dot. */
export function Eyebrow({ children, variant = 'start', className = '' }: { children: React.ReactNode; variant?: 'start' | 'center' | 'pill'; className?: string }) {
  if (variant === 'pill') {
    return <p className={`eyebrow-pill ${className}`}><span aria-hidden="true" className="eyebrow-dot" />{children}</p>;
  }
  return <p className={`${variant === 'center' ? 'eyebrow-line' : 'eyebrow-line-start'} ${className}`}>{children}</p>;
}

/**
 * One page band: tone, label + H2 heading block, then content, then the optional action
 * under the content (centred): the reader has seen the list when they reach it.
 */
export function Section({ id, tone = 'white', label, title, highlight, intro, action, children, className = '', headingLevel = 'h2', contain = true, align = 'start', eyebrow = 'line', labelledBy }: {
  id?: string;
  tone?: Tone;
  label?: string;
  title?: string;
  /** A word or phrase of the title shown in gold (one per headline). */
  highlight?: string;
  intro?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingLevel?: 'h1' | 'h2';
  /** Off for a band whose end must never be clipped (the logo row). */
  contain?: boolean;
  /** Heading block on the left (default) or centred. */
  align?: 'start' | 'center';
  /** Label style: gold hairline label (default) or the square pill with the pulsing dot. */
  eyebrow?: 'line' | 'pill';
  /** Id of a heading rendered inside the children (bands that draw their own head), for the section's accessible name. */
  labelledBy?: string;
}) {
  const headingId = title ? `h-${id ?? slugId(title)}` : undefined;
  const Heading = headingLevel;
  const warm = tone === 'dark' || tone === 'warm';
  const center = align === 'center';
  return (
    <section id={id} aria-labelledby={headingId ?? labelledBy} className={`${tones[tone]} ${contain && !warm ? 'cv-auto' : ''} ${warm ? 'relative overflow-hidden' : ''} py-16 md:py-24 ${className}`}>
      {warm ? <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" /> : null}
      <div className={`container-site ${warm ? 'relative' : ''}`}>
        {title ? (
          <div data-reveal className={`mb-10 flex flex-wrap items-end gap-x-10 gap-y-5 md:mb-14 ${center ? 'justify-center text-center' : 'justify-between'}`}>
            <div className={center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
              {label ? <Eyebrow variant={eyebrow === 'pill' ? 'pill' : center ? 'center' : 'start'} className="mb-4">{label}</Eyebrow> : null}
              <Heading id={headingId} className={headingLevel === 'h1' ? 'text-display' : 'text-h2'}>{withHighlight(title, highlight)}</Heading>
              {intro ? <p className={`text-lede mt-4 text-muted ${center ? 'mx-auto' : ''}`}>{intro}</p> : null}
            </div>
          </div>
        ) : null}
        {children}
        {title && action ? <div className="section-more">{action}</div> : null}
      </div>
    </section>
  );
}
