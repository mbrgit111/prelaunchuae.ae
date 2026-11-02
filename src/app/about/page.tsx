import { config, copy, imagery } from '@/site';
import { getProject } from '@/data';
import { siteStats } from '@/data/insights';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { LicenceList, licenceItems } from '@/components/ui/Licence';
import { showPlaceholders } from '@/lib/contact';

const a = copy.pages.about;
export const metadata = pageMetadata({ title: a.metaTitle, description: a.lede, path: '/about' });

export default async function AboutPage() {
  const s = await siteStats();
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]} label={`${config.name}, operated by ${config.operatedBy}`} title={a.h1} lede={a.lede} image={(await getProject(imagery.about))?.cover} />
      <Section id="approach" tone="white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {a.sections.map((x, i) => (
            <section key={x.title} data-reveal style={{ '--i': i } as React.CSSProperties} aria-labelledby={`ab-${i}`} className="relative grid content-start gap-3 border-t border-line-strong pt-6">
              <span aria-hidden="true" className="absolute -top-[5px] left-0 size-[9px] bg-survey" />
              <h2 id={`ab-${i}`} className="text-h3">{x.title}</h2>
              <p className="text-muted">{x.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted">Today we list {s.projects.toLocaleString('en-US')} pre-launch projects in {s.areas} areas across {s.emirates.length} emirates, from {s.developers} developers; {s.selling.toLocaleString('en-US')} are launching now.</p>
        {licenceItems().some((i) => i.value) || showPlaceholders ? (
          <section aria-labelledby="ab-licence" className="mt-12 grid gap-4">
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
