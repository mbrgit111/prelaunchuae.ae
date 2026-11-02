import { config } from '@/site';

/** Share links that are plain addresses: nothing is loaded from other companies until someone taps one. */
export function ShareLinks({ path, title }: { path: string; title: string }) {
  const url = new URL(path, config.url).toString();
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    ['WhatsApp', `https://wa.me/?text=${t}%20${u}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ['X', `https://twitter.com/intent/tweet?text=${t}&url=${u}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['Email', `mailto:?subject=${t}&body=${u}`],
  ] as const;
  return (
    <section aria-label="Share this article" className="grid gap-3">
      <h2 className="text-label">Share</h2>
      <ul className="flex flex-wrap gap-2">
        {links.map(([name, href]) => (
          <li key={name}>
            <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-ink">
              {name}
              <span className="sr-only"> (opens a share page)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
