import type { MetadataRoute } from 'next';
import { config } from '@/site';
import { getCategories, getPostCards, getSitemapEntries } from '@/lib/content';
import { allRoutes } from '@/lib/routes';

// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;

/** sitemap.xml, generated from the data. Article dates come from the desk's own sitemap list (/sitemap-posts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cards, entries, categories] = await Promise.all([getPostCards(), getSitemapEntries(), getCategories().catch(() => [])]);
  const lastmod = new Map(entries.map((entry) => [entry.path, entry.lastmod]));
  return (await allRoutes(cards, categories)).map((r) => ({
    url: new URL(r.path, config.url).toString(),
    ...((lastmod.get(r.path) ?? r.lastModified) ? { lastModified: (lastmod.get(r.path) ?? r.lastModified)! } : {}),
    priority: r.priority,
  }));
}
