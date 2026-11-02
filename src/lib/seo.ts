import type { Metadata } from 'next';
import { config } from '@/site';

interface PageSeo {
  title: string; // without the brand (the layout template adds " | PrelaunchUAE")
  description: string;
  path: string; // "/" or "/projects/arche-residences"
  absoluteTitle?: boolean;
  noindex?: boolean;
  image?: { url: string; width: number; height: number; alt: string };
}

/** Unique title, description, canonical, hreflang (Arabic-ready), Open Graph and Twitter tags for one page. */
export function pageMetadata({ title, description, path, absoluteTitle, noindex, image }: PageSeo): Metadata {
  const languages: Record<string, string> = { [config.locale]: path, 'x-default': path };
  for (const [locale, prefix] of Object.entries(config.alternateLocales)) languages[locale] = `${prefix}${path === '/' ? '' : path}`;
  const fullTitle = absoluteTitle ? title : `${title} | ${config.name}`;
  const og = image ?? { url: config.ogImage.src, width: config.ogImage.width, height: config.ogImage.height, alt: config.name };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path, languages, types: { 'application/rss+xml': [{ url: '/feed.xml', title: `${config.name}: articles` }] } },
    openGraph: { type: 'website', url: path, siteName: config.name, locale: config.locale.replace('-', '_'), title: fullTitle, description, images: [og] },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [og.url] },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export const clip = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

/**
 * Picks the most descriptive title that fits search results (about 60 characters including " | PrelaunchUAE").
 * Falls back to the shortest option without the brand suffix.
 */
export function fitTitle(options: string[], max = 62): { title: string; absoluteTitle?: boolean } {
  const suffix = ` | ${config.name}`.length;
  const fit = options.find((t) => t.length + suffix <= max);
  if (fit) return { title: fit };
  const shortest = [...options].sort((a, b) => a.length - b.length)[0]!;
  return { title: shortest, absoluteTitle: true };
}
