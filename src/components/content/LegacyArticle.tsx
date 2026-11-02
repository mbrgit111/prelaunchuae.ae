import Image from 'next/image';
import type { Post } from '@/data';
import { RegisterBand } from '@/components/sections/MoreSections';
import { ArticleBody } from '@/components/ui/ArticleBody';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { articleSchema } from '@/lib/schema';
import { longDate } from './ArticleCard';

/** The older articles that still live in data/posts.json. They go away once they have been imported into the desk. */
export function LegacyArticle({ post: p, section }: { post: Post; section: { name: string; path: string } }) {
  return (
    <>
      <JsonLd data={articleSchema({ title: p.title, description: p.excerpt, slug: p.slug, date: p.date, image: p.image })} />
      <PageHero crumbs={[{ name: 'Home', path: '/' }, section, { name: p.title, path: `${section.path}/${p.slug}` }]} label={`${p.category} · ${longDate(p.date)}`} title={p.title} lede={p.excerpt} />
      <article className="on-white bg-white py-14 md:py-20">
        <div className="container-site grid max-w-3xl gap-5 text-[17px]">
          {p.image ? <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-brand-lg"><Image src={p.image} alt={p.imageAlt ?? ''} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" /></div> : null}
          <ArticleBody blocks={p.body} />
        </div>
      </article>
      <RegisterBand />
    </>
  );
}
