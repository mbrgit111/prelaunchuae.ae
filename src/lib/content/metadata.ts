import 'server-only';
import type { Metadata } from 'next';
import { config } from '@/site';
import { fitTitle, pageMetadata } from '@/lib/seo';
import type { Media, PostDetail } from './types';

/** A share picture for social networks: the biggest WebP the desk made (or the single address), else the site's own image. */
function shareImage(media: Media | null | undefined) {
  if (!media) return undefined;
  const webp = media.variants.filter((v) => v.format === 'webp').sort((a, b) => b.width - a.width)[0];
  const url = webp?.url || media.url;
  if (!url) return undefined;
  const width = webp?.width || media.width || 1200;
  const height = media.width && media.height ? Math.round((width * media.height) / media.width) : Math.round(width * 0.525);
  return { url, width, height, alt: media.alt || '' };
}

/**
 * Everything search engines and social networks read, taken from the post: its own title and description, canonical,
 * robots, share picture (share picture, else cover, else the site's own), and published and updated times.
 * A preview is never indexable.
 */
export function articleMetadata(post: PostDetail, preview: boolean): Metadata {
  const image = shareImage(post.seo.ogImage) ?? shareImage(post.cover);
  // Search results show about 60 characters. The brand is added only when the whole title still fits (as on project pages);
  // otherwise the desk's own title is used as it is.
  const base = pageMetadata({
    ...fitTitle([post.seo.metaTitle || post.title]),
    description: post.seo.metaDescription || post.excerpt,
    path: post.path,
    noindex: preview || post.seo.noindex,
    ...(image ? { image } : {}),
  });
  const canonical = post.seo.canonicalUrl && /^https?:\/\//.test(post.seo.canonicalUrl) ? post.seo.canonicalUrl : post.path;
  const shareTitle = fitTitle([post.seo.ogTitle || post.seo.metaTitle || post.title]);
  const fullTitle = shareTitle.absoluteTitle ? shareTitle.title : `${shareTitle.title} | ${config.name}`;
  const ogImage = image ?? { url: config.ogImage.src, width: config.ogImage.width, height: config.ogImage.height, alt: config.name };
  return {
    ...base,
    alternates: { ...base.alternates, canonical },
    ...(preview ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } } : {}),
    openGraph: {
      type: 'article',
      url: post.path,
      siteName: config.name,
      locale: config.locale.replace('-', '_'),
      title: fullTitle,
      description: post.seo.ogDescription || post.seo.metaDescription || post.excerpt,
      images: [ogImage],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(post.author ? { authors: [new URL(`/author/${post.author.slug}`, config.url).toString()] } : {}),
      ...(post.category ? { section: post.category.name } : {}),
      ...(post.tags.length ? { tags: post.tags } : {}),
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description: post.seo.ogDescription || post.seo.metaDescription || post.excerpt, images: [ogImage.url] },
  };
}
