import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { CategoryChips, EmptyState, Listing, pagePath } from '@/components/content/Listing';
import { CoverImage } from '@/components/content/CoverImage';
import { getAuthor, getCategories, listPostsPage } from '@/lib/content';
import type { ListFilter } from '@/lib/content/lists';
import { pageMetadata } from '@/lib/seo';
import { config } from '@/site';

/** "2" in /blog/page/2. Page 1 is the plain list address, so /page/1 is sent there; anything not a number is a 404. */
function pageNumber(raw: string | undefined, base: string): number {
  if (raw === undefined) return 1;
  if (!/^\d{1,3}$/.test(raw)) notFound();
  const n = Number(raw);
  if (n === 1) permanentRedirect(base);
  if (n < 1) notFound();
  return n;
}

const suffix = (page: number) => (page > 1 ? `, page ${page}` : '');

type Section = { base: string; filter: ListFilter; title: string; description: string; label: string; heading: string; lede?: string; crumbs: { name: string; path: string }[] };

async function build(section: Section, rawPage: string | undefined) {
  const page = pageNumber(rawPage, section.base);
  const data = await listPostsPage(section.filter, page);
  if (page > data.totalPages) notFound();
  return { page, data };
}

async function metadataFor(section: Section, rawPage: string | undefined, forceNoindex = false): Promise<Metadata> {
  const page = Number(rawPage && /^\d{1,3}$/.test(rawPage) ? rawPage : 1);
  const data = await listPostsPage(section.filter, page);
  return pageMetadata({
    title: `${section.title}${suffix(page)}`,
    description: section.description,
    path: pagePath(section.base, page),
    noindex: forceNoindex || data.total === 0,
  });
}

// ---------- Blog and news ----------

const BLOG: Section = {
  base: '/blog',
  filter: { type: 'blog' },
  title: `Dubai and ${config.community.name} Property Blog: Guides and Insights`,
  description: `Guides and insights on buying off-plan property in Dubai and the ${config.community.name}.`,
  label: 'Insights',
  heading: 'Guides and insights',
  crumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }],
};
const NEWS: Section = {
  base: '/news',
  filter: { type: 'news' },
  title: `Dubai and ${config.community.name} Property News`,
  description: `New launches, handover updates and project news from Dubai and the ${config.community.name}, gathered by ${config.name}.`,
  label: 'News',
  heading: 'Property news',
  crumbs: [{ name: 'Home', path: '/' }, { name: 'News', path: '/news' }],
};

export const blogMetadata = (page?: string) => metadataFor(BLOG, page);
export const newsMetadata = (page?: string) => metadataFor(NEWS, page);

export async function BlogIndex({ page: raw }: { page?: string }) {
  const { page, data } = await build(BLOG, raw);
  const categories = await getCategories();
  return (
    <Listing
      crumbs={BLOG.crumbs}
      label={BLOG.label}
      title={BLOG.heading}
      data={data}
      base={BLOG.base}
      chips={page === 1 || categories.length ? <CategoryChips categories={categories} allPath="/blog" /> : null}
      empty={
        <EmptyState title="Articles are on the way">
          <p>
            In the meantime, the <Link href={`/${config.community.slug}`} className="link-accent">area guides</Link> cover every community, and <Link href="/projects" className="link-accent">the projects list</Link> shows what is on offer today.
          </p>
        </EmptyState>
      }
    />
  );
}

export async function NewsIndex({ page: raw }: { page?: string }) {
  const { data } = await build(NEWS, raw);
  return (
    <Listing
      crumbs={NEWS.crumbs}
      label={NEWS.label}
      title={NEWS.heading}
      data={data}
      base={NEWS.base}
      empty={
        <EmptyState title="No news yet">
          <p>
            See the latest <Link href="/projects" className="link-accent">projects across the {config.community.name}</Link>, or read the <Link href="/blog" className="link-accent">blog</Link>.
          </p>
        </EmptyState>
      }
    />
  );
}

// ---------- One category ----------

async function categoryFor(slug: string) {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return { category, categories };
}

const categorySection = (slug: string, name: string, description: string): Section => ({
  base: `/category/${slug}`,
  filter: { category: slug },
  title: `${name}: articles`,
  description: description || `${name} articles from ${config.name}.`,
  label: 'Topic',
  heading: name,
  ...(description ? { lede: description } : {}),
  crumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name, path: `/category/${slug}` }],
});

export async function categoryMetadata(slug: string, page?: string): Promise<Metadata> {
  const { category } = await categoryFor(slug);
  return metadataFor(categorySection(slug, category.name, category.description), page);
}

export async function CategoryIndex({ slug, page: raw }: { slug: string; page?: string }) {
  const { category, categories } = await categoryFor(slug);
  const section = categorySection(slug, category.name, category.description);
  const { data } = await build(section, raw);
  return (
    <Listing
      crumbs={section.crumbs}
      label={section.label}
      title={section.heading}
      lede={section.lede}
      data={data}
      base={section.base}
      chips={<CategoryChips categories={categories} current={slug} allPath="/blog" />}
      empty={
        <EmptyState title={`Nothing in ${category.name} yet`}>
          <p>
            See <Link href="/blog" className="link-accent">all articles</Link>.
          </p>
        </EmptyState>
      }
    />
  );
}

// ---------- One author ----------

const authorSection = (slug: string, name: string, bio: string): Section => ({
  base: `/author/${slug}`,
  filter: { author: slug },
  title: `Articles by ${name}`,
  description: bio || `Articles by ${name}, ${config.name}.`,
  label: 'Author',
  heading: name,
  crumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name, path: `/author/${slug}` }],
});

export async function authorMetadata(slug: string, page?: string): Promise<Metadata> {
  const author = await getAuthor(slug);
  if (!author) return { robots: { index: false, follow: false } };
  return metadataFor(authorSection(slug, author.name, author.bio), page);
}

export async function AuthorIndex({ slug, page: raw }: { slug: string; page?: string }) {
  const author = await getAuthor(slug);
  if (!author) notFound();
  const section = authorSection(slug, author.name, author.bio);
  const { data } = await build(section, raw);
  const links = [
    ['Website', author.social.website],
    ['LinkedIn', author.social.linkedin],
  ].filter(([, href]) => href && /^https:\/\//.test(href!));
  return (
    <Listing
      crumbs={section.crumbs}
      label={section.label}
      title={section.heading}
      lede={author.title || undefined}
      data={data}
      base={section.base}
      before={
        <section aria-label={`About ${author.name}`} className="mb-10 flex max-w-3xl flex-wrap items-start gap-5">
          {author.photo ? (
            <CoverImage media={author.photo} alt={author.name} sizes="96px" aspect="1 / 1" className="size-24 shrink-0 rounded-full" />
          ) : null}
          <div className="grid gap-2">
            {author.bio ? <p className="text-[17px]">{author.bio}</p> : null}
            {links.length ? (
              <ul className="flex flex-wrap gap-4 text-sm">
                {links.map(([name, href]) => (
                  <li key={name}>
                    <a href={href} rel="noopener noreferrer me" target="_blank" className="link-accent">{name}</a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      }
      empty={<EmptyState title="No articles yet"><p>Nothing by {author.name} has been published yet.</p></EmptyState>}
    />
  );
}

