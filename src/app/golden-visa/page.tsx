import { copy } from '@/site';
import { marketFaqsFor } from '@/data/faq';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Faq } from '@/components/ui/Faq';
import { Flag } from '@/components/ui/Flag';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';

const g = copy.pages.goldenVisa;
export const metadata = pageMetadata({ ...copy.seo.goldenVisa, absoluteTitle: true, path: '/golden-visa' });

export default async function GoldenVisaPage() {
  const gv = (await marketFaqsFor()).filter((f) => /golden visa/i.test(f.q));
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Golden Visa guide', path: '/golden-visa' }]} label="Residency" title={g.h1} lede={<>{g.lede}<Flag>{g.flag}</Flag></>} />
      <Section id="guide" tone="white">
        <div className="grid max-w-3xl gap-10">
          {g.sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`gv-${i}`} className="grid gap-3">
              <h2 id={`gv-${i}`} className="text-h2">{s.title}</h2>
              <p className="text-[17px] text-muted">{s.body}</p>
            </section>
          ))}
          <Disclaimer>{g.disclaimer}</Disclaimer>
        </div>
      </Section>
      {gv.length ? (
        <Section id="faq" tone="sand" label="FAQ" title="Golden Visa questions">
          <div className="max-w-4xl"><Faq items={gv} /></div>
        </Section>
      ) : null}
      <RegisterBand />
    </>
  );
}
