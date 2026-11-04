type Tone = 'white' | 'sand' | 'tint' | 'dark';
// Mostly white and sand; plot ("tint") for soft emphasis; datum for two or three bands a page (guidelines 02 and 05).
const tones: Record<Tone, string> = {
  white: 'on-white bg-white',
  sand: 'on-sand bg-sand',
  tint: 'on-tint bg-plot',
  dark: 'on-dark bg-datum text-sand',
};

export const slugId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * One page band: tone, label + H2 heading block, then content, then the optional action
 * under the content (centred): the reader has seen the list when they reach it.
 */
export function Section({ id, tone = 'white', label, title, intro, action, children, className = '', headingLevel = 'h2', contain = true }: {
  id?: string;
  tone?: Tone;
  label?: string;
  title?: string;
  intro?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingLevel?: 'h1' | 'h2';
  /** Off for a band whose end must never be clipped (the logo row). */
  contain?: boolean;
}) {
  const headingId = title ? `h-${id ?? slugId(title)}` : undefined;
  const Heading = headingLevel;
  const dark = tone === 'dark';
  return (
    <section id={id} aria-labelledby={headingId} className={`${tones[tone]} ${contain && tone !== 'dark' ? 'cv-auto' : ''} py-16 md:py-24 ${className}`}>
      <div className="container-site">
        {title ? (
          <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 md:mb-14">
            <div className="max-w-2xl">
              {label ? <p className="text-label mb-4 flex items-center gap-2.5"><span aria-hidden="true" className="size-2 bg-current" />{label}</p> : null}
              <Heading id={headingId} className={headingLevel === 'h1' ? 'text-display' : 'text-h2'}>{title}</Heading>
              {intro ? <p className={`text-lede mt-4 ${dark ? 'text-muted-on-deep' : 'text-muted'}`}>{intro}</p> : null}
            </div>
          </div>
        ) : null}
        {children}
        {title && action ? <div className="section-more">{action}</div> : null}
      </div>
    </section>
  );
}
