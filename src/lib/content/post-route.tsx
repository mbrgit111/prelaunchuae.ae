import 'server-only';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getProjects } from '@/data';
import { ArticleView } from '@/components/content/ArticleView';
import { LegacyArticle } from '@/components/content/LegacyArticle';
import { getAllCards, getPostDetail } from '@/lib/content';
import { articleMetadata } from './metadata';
import { pageMetadata } from '@/lib/seo';

type Kind = 'blog' | 'news';

const SECTION = { blog: { name: 'Blog', path: '/blog' }, news: { name: 'News', path: '/news' } } as const;
const fileKind = (category: string): Kind => (/news/i.test(category) ? 'news' : 'blog');

/** The addresses to build ahead of time: every live article of this kind. The rest are built on first visit. */
export async function postStaticParams(kind: Kind) {
  const { cards } = await getAllCards();
  return cards.filter((card) => card.type === kind).map((card) => ({ slug: card.slug }));
}

export async function postMetadata(slug: string, kind: Kind): Promise<Metadata> {
  const detail = await getPostDetail(slug);
  if (!detail) return { robots: { index: false, follow: false } };
  if (detail.kind === 'api') return articleMetadata(detail.post, detail.preview);
  const p = detail.post;
  return pageMetadata({ title: p.seoTitle ?? p.title, description: p.excerpt, path: `${SECTION[fileKind(p.category)].path}/${p.slug}` });
}

/**
 * One article page, shared by /blog/<slug> and /news/<slug>. A news item opened under /blog (or the other way round)
 * is sent to its right address with a permanent redirect, so there is only ever one address for each article.
 */
export async function PostRoute({ slug, kind }: { slug: string; kind: Kind }) {
  const detail = await getPostDetail(slug);
  if (!detail) notFound();
  if (detail.kind === 'file') {
    const right = fileKind(detail.post.category);
    if (right !== kind) permanentRedirect(`${SECTION[right].path}/${detail.post.slug}`);
    return <LegacyArticle post={detail.post} section={SECTION[kind]} />;
  }
  if (detail.post.type !== kind) permanentRedirect(detail.post.path);
  return <ArticleView post={detail.post} preview={detail.preview} projects={await getProjects()} />;
}

