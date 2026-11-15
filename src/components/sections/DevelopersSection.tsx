import Image from 'next/image';
import Link from 'next/link';
import { copy, imagery } from '@/site';
import { getDeveloper, getDevelopers, getProjects } from '@/data';
import { Icon } from '../ui/Icon';
import { LogoMark } from '../ui/LogoMark';
import { Section } from '../ui/Section';
import { Head, More } from './MoreSections';

/** Developers: the one with most projects listed, the next six, then a strip of monochrome logos. */
export async function DevelopersSection() {
  const d = copy.home.developers;
  const all = await getDevelopers();
  const bySlug = new Map((await getProjects()).map((project) => [project.slug, project]));
  const featured = (imagery.featuredDeveloper && (await getDeveloper(imagery.featuredDeveloper))) || all[0];
  const areasOf = (slugs: string[]) => new Set(slugs.map((s) => bySlug.get(s)?.communityName).filter(Boolean)).size;
  if (!featured) return null;
  const featuredProjects = featured.projectSlugs.map((slug) => bySlug.get(slug)).filter((project) => project !== undefined);
  const cover = featuredProjects.find((p) => p.cover)?.cover;
  const rest = all.filter((x) => x.slug !== featured.slug).slice(0, 6);
  const logos = all.filter((x) => x.logo).slice(0, 24);
  return (
    <Section id="developers" labelledBy="h-developers" tone="sand" contain={false}>
      <Head id="h-developers" label={d.label} title={d.title} accent={d.accent} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Link href={`/developers/${featured.slug}`} data-reveal className="card card-lift group grid overflow-hidden md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
            {cover ? <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 1280px) 330px, (min-width: 768px) 50vw, 100vw" className="img-zoom object-cover" /> : <div aria-hidden="true" className="gold-grid absolute inset-0" />}
          </div>
          <div className="grid content-start gap-4 p-6 md:p-8">
            <p className="text-label">{d.featuredLabel}</p>
            <LogoMark logo={featured.logo} name={featured.name} frame="feature" />
            <h3 className="text-h3 text-heading">{featured.name}</h3>
            <p className="text-[15px] leading-relaxed text-muted">
              {featuredProjects.length} project{featuredProjects.length === 1 ? '' : 's'} listed across {areasOf(featured.projectSlugs)} area{areasOf(featured.projectSlugs) === 1 ? '' : 's'}, including {featuredProjects.slice(0, 3).map((p) => p.name).join(', ')}.
            </p>
            <span aria-hidden="true" className="btn btn-primary btn-sm justify-self-start">View {featured.name} projects <Icon name="arrow-right" className="size-4" /></span>
          </div>
        </Link>
        <ul className="grid gap-4 sm:grid-cols-2">
          {rest.map((x, i) => (
            <li key={x.slug} data-reveal style={{ '--i': i % 2 } as React.CSSProperties}>
              <Link href={`/developers/${x.slug}`} className="card card-lift group flex h-full items-center gap-4 p-5">
                <LogoMark logo={x.logo} name={x.name} frame="card" labelled={false} />
                <span className="grid">
                  <span className="font-semibold leading-snug text-heading transition-colors group-hover:text-gold-hover">{x.name}</span>
                  <span className="text-sm text-muted">{x.projectSlugs.length} project{x.projectSlugs.length === 1 ? '' : 's'} · {areasOf(x.projectSlugs)} area{areasOf(x.projectSlugs) === 1 ? '' : 's'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {logos.length > 0 ? (
        <ul className="swipe-row swipe-row-sm mt-12 grid grid-cols-2 gap-3 border-y border-line py-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-label="Developer logos">
          {logos.map((x) => (
            <li key={x.slug}>
              <Link href={`/developers/${x.slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2">
                <LogoMark logo={x.logo} name={x.name} frame="strip" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-xs text-muted">{d.logoNote}</p>
      <More href="/developers">{d.action}</More>
    </Section>
  );
}
