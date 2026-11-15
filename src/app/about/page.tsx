import { config, copy, imagery } from '@/site';
import { getProject } from '@/data';
import { siteStats } from '@/data/insights';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { PageHero } from '@/components/ui/PageHero';
import { HeroFigures } from '@/components/pages/HeroFigures';
import { Section } from '@/components/ui/Section';
import { LicenceList, licenceItems } from '@/components/ui/Licence';
import { showPlaceholders } from '@/lib/contact';

const a = copy.pages.about;
export const metadata = pageMetadata({ title: a.metaTitle, description: a.lede, path: '/about' });

export default async function AboutPage() {
  const s = await siteStats();
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} label={`${config.name}, operated by ${config.operatedBy}`} title={a.h1} highlight={a.highlight} lede={a.lede} image={(await getProject(imagery.about))?.cover}>
        <HeroFigures
          items={[
            [s.projects.toLocaleString('en-US'), 'projects'],
            [s.areas, 'areas'],
            [s.emirates.length, s.emirates.length === 1 ? 'emirate' : 'emirates'],
            [s.developers, 'developers'],
          ]}
        />
      </PageHero>
      <Section id="approach" tone="white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {a.sections.map((x, i) => (
            <section key={x.title} data-reveal style={{ '--i': i } as React.CSSProperties} aria-labelledby={`ab-${i}`} className="card card-lift grid content-start gap-3 p-6 md:p-7">
              <span aria-hidden="true" className="text-figure text-[44px] leading-none text-gold/25">{String(i + 1).padStart(2, '0')}</span>
              <h2 id={`ab-${i}`} className="text-h3">{x.title}</h2>
              <p className="text-body">{x.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 border-l-2 border-gold pl-5 text-body">Today we list {s.projects.toLocaleString('en-US')} pre-launch projects in {s.areas} areas across {s.emirates.length} emirates, from {s.developers} developers; {s.selling.toLocaleString('en-US')} are launching now.</p>
        {licenceItems().some((i) => i.value) || showPlaceholders ? (
          <section aria-labelledby="ab-licence" className="mt-12 grid gap-4 border-t border-line pt-10">
            <h2 id="ab-licence" className="text-h3">Licence and registration</h2>
            <p className="text-muted">{config.name} is operated by {config.operatedBy}.</p>
            <LicenceList className="max-w-3xl" />
          </section>
        ) : null}
      </Section>
      <RegisterBand />
    </>
  );
}
