import { config, contact, copy } from '@/site';
import { pageMetadata } from '@/lib/seo';
import { Flag } from '@/components/ui/Flag';
import { PageHero } from '@/components/ui/PageHero';

type Slug = 'privacy' | 'terms' | 'disclaimer' | 'cookie-policy';
const page = (slug: Slug) => copy.legalPages(config.operatedBy, contact.email).find((p) => p.slug === slug)!;

export const legalMetadata = (slug: Slug) => {
  const p = page(slug);
  return pageMetadata({ title: p.title, description: p.metaDescription, path: `/${slug}` });
};

/** Legal drafts (reviewed by MBR's legal adviser before launch). Contact details come from contact.ts. */
export function LegalPage({ slug }: { slug: Slug }) {
  const p = page(slug);
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: p.title, path: `/${slug}` }]} label="Legal" title={p.title} lede={<>{p.metaDescription}<Flag>LEGAL REVIEW REQUIRED</Flag></>} />
      <section className="on-white bg-white py-14 md:py-20">
        <div className="container-site grid max-w-3xl gap-10">
          {p.sections.map((s, i) => (
            <section key={s.title} aria-labelledby={`lg-${i}`} className="grid gap-3">
              <h2 id={`lg-${i}`} className="text-h3">{s.title}</h2>
              {s.body.map((b, k) => <p key={k} className="text-muted">{b}</p>)}
            </section>
          ))}
          <p className="text-sm text-muted">
            {config.name} is operated by {config.operatedBy}.{contact.email ? ` Email ${contact.email}.` : ''}{contact.phone.display ? ` Phone ${contact.phone.display}.` : ''}
          </p>
        </div>
      </section>
    </>
  );
}
