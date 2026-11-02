import Link from 'next/link';
import type { Project } from '@/data';
import { RegisterBand } from '@/components/sections/MoreSections';
import { ApiArticleBody } from '@/components/ui/ApiArticleBody';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { ProjectCard } from '@/components/ui/ProjectCard';
import type { PostDetail } from '@/lib/content/types';
import { copy } from '@/site';
import { ArticleCard, longDate } from './ArticleCard';
import { CoverImage } from './CoverImage';
import { PreviewBanner } from './PreviewBanner';
import { ShareLinks } from './ShareLinks';

const DAY = 86_400_000;

/** A full article from the desk: blog and news use the same page, with the small differences (dateline, sources) shown only when present. */
export function ArticleView({ post, preview = false, status, projects = [] }: { post: PostDetail; preview?: boolean; status?: string; projects?: Project[] }) {
  const isNews = post.type === 'news';
  const section = isNews ? { name: 'News', path: '/news' } : { name: 'Blog', path: '/blog' };
  const showUpdated = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > DAY;
  const toc = post.headings.filter((h) => h.level === 2);
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const related = post.relatedProjectSlugs.map((slug) => bySlug.get(slug)).filter((project) => project !== undefined).slice(0, 3);

  return (
    <>
      {preview ? <PreviewBanner status={status} /> : null}
      {post.jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, section, { name: post.title, path: post.path }]}
        label={isNews ? `News${post.dateline ? ` · ${post.dateline}` : ''}` : (post.category?.name ?? 'Insights')}
        title={post.title}
        lede={post.excerpt}
      />
      <article className="on-white bg-white py-12 md:py-16">
        <div className="container-site grid max-w-3xl gap-6 text-[17px]">
          <p className="text-sm text-muted">
            {post.author ? (
              <>
                By <Link href={`/author/${post.author.slug}`} className="font-semibold text-ink underline underline-offset-4">{post.author.name}</Link>
                {' · '}
              </>
            ) : null}
            <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
            {showUpdated ? (
              <>
                {' · Updated '}
                <time dateTime={post.updatedAt}>{longDate(post.updatedAt)}</time>
              </>
            ) : null}
            {' · '}
            {post.readingTime} min read
            {isNews && post.news?.location ? ` · ${post.news.location}` : ''}
          </p>

          {post.cover ? (
            <figure className="grid gap-2">
              <CoverImage media={post.cover} sizes="(min-width: 768px) 720px, 100vw" priority className="rounded-brand-lg" />
              {post.cover.caption || post.cover.credit ? (
                <figcaption className="text-sm text-muted">
                  {post.cover.caption}
                  {post.cover.caption && post.cover.credit ? ' · ' : ''}
                  {post.cover.credit ? `Photo: ${post.cover.credit}` : ''}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {toc.length >= 3 ? (
            <nav aria-label="In this article" className="on-sand rounded-brand border border-line bg-sand p-5">
              <h2 className="text-label">In this article</h2>
              <ol className="mt-3 grid list-decimal gap-1 pl-5 text-[15px]">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="link-accent">{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="api-prose grid gap-5">
            <ApiArticleBody doc={post.body} headings={post.headings} faq={post.faq} projects={projects} />
          </div>

          {post.sources.length > 0 ? (
            <section aria-labelledby="sources" className="grid gap-2 border-t border-line pt-6">
              <h2 id="sources" className="text-label">Sources</h2>
              <ul className="grid gap-2 text-[15px] text-muted">
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noopener noreferrer nofollow" target="_blank" className="link-accent">{s.title || s.url}</a>
                    {s.publisher ? `, ${s.publisher}` : ''}
                    {s.accessedAt ? ` (seen ${longDate(s.accessedAt)})` : ''}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {post.author ? (
            <aside aria-label="About the author" className="grid gap-1 rounded-brand border border-line p-5">
              <p className="font-semibold">
                <Link href={`/author/${post.author.slug}`}>{post.author.name}</Link>
                {post.author.title ? <span className="font-normal text-muted">, {post.author.title}</span> : null}
              </p>
              {post.author.bio ? <p className="text-[15px] text-muted">{post.author.bio}</p> : null}
            </aside>
          ) : null}

          <ShareLinks path={post.path} title={post.title} />
          <Disclaimer>{copy.home.investment.disclaimer}</Disclaimer>

          {post.prev || post.next ? (
            <nav aria-label="Previous and next article" className="grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {post.prev ? (
                <Link href={post.prev.path} rel="prev" className="rounded-brand border border-line p-4 hover:border-ink">
                  <span className="text-label block">Older</span>
                  <span className="mt-1 block font-semibold">{post.prev.title}</span>
                </Link>
              ) : <span />}
              {post.next ? (
                <Link href={post.next.path} rel="next" className="rounded-brand border border-line p-4 hover:border-ink sm:text-right">
                  <span className="text-label block">Newer</span>
                  <span className="mt-1 block font-semibold">{post.next.title}</span>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="mentioned-projects" className="on-sand bg-sand py-12 md:py-16">
          <div className="container-site grid gap-6">
            <h2 id="mentioned-projects" className="text-h2">Projects mentioned</h2>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((p, i) => (
                <li key={p.slug}><ProjectCard p={p} index={i} headingLevel="h3" defer /></li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {post.related.length > 0 ? (
        <section aria-labelledby="related" className={`${related.length ? 'on-white bg-white' : 'on-sand bg-sand'} py-12 md:py-16`}>
          <div className="container-site grid gap-6">
            <h2 id="related" className="text-h2">Keep reading</h2>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {post.related.slice(0, 3).map((card) => (
                <li key={card.id}><ArticleCard card={card} headingLevel="h3" /></li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <RegisterBand />
    </>
  );
}
