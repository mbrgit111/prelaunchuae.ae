import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { config, copy, contact } from '@/site';
import { featuredProjects, getDeveloper, getProject, type Project } from '@/data';
import { areaOf, getArea } from '@/data/areas';
import { relatedProjects } from '@/data/insights';
import { aed } from '@/lib/format';
import { residenceSchema } from '@/lib/schema';
import { clip, fitTitle, pageMetadata } from '@/lib/seo';
import { telHref } from '@/lib/contact';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { PaymentPlans } from '@/components/project/PaymentPlans';
import { ProjectPosts } from '@/components/content/LatestPosts';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DeferredImage } from '@/components/ui/DeferredImage';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Faq } from '@/components/ui/Faq';
import { Gallery, type GalleryItem } from '@/components/ui/Gallery';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { ProjectCard, priceText, statusLabel, statusTone } from '@/components/ui/ProjectCard';
import { Section } from '@/components/ui/Section';
import { PermitBox } from '@/components/ui/Licence';

// The first PREBUILT projects in the site's order (the new launches people land on) are made at build time. Every other
// project page is made the first time someone opens it, then kept and refreshed hourly (and when the desk publishes).
// Building all 2,400 up front took a Vercel build past its 45-minute limit.
const PREBUILT = 240;
export const dynamicParams = true;
// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;
export const generateStaticParams = async () => (await featuredProjects()).slice(0, PREBUILT).map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return pageMetadata({
    ...fitTitle([`${p.name} by ${p.developerName}, ${p.communityName}`, `${p.name} by ${p.developerName}`, `${p.name}, ${p.communityName}`, p.name]),
    description: clip(copy.projectDescription(p)),
    path: `/projects/${p.slug}`,
    image: { url: `/projects/${p.slug}/opengraph-image`, width: 1200, height: 630, alt: `${p.name}, ${p.communityName}` },
  });
}

function Fact({ label, value, note }: { label: string; value: React.ReactNode; note?: string | null }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-sage">{label}</dt>
      <dd className="text-lg font-semibold leading-snug">{value}</dd>
      {note ? <dd className="text-xs text-muted-on-deep">{note}</dd> : null}
    </div>
  );
}

function H2({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 grid gap-2">
      <p className="text-label">{label}</p>
      <h2 id={id} className="text-h2">{children}</h2>
    </div>
  );
}


function sizeRange(u: Project['units'][number]) {
  if (!u.areaFrom) return '—';
  return u.areaTo && u.areaTo !== u.areaFrom ? `${u.areaFrom.toLocaleString('en-US')} to ${u.areaTo.toLocaleString('en-US')}` : u.areaFrom.toLocaleString('en-US');
}
function priceRange(u: Project['units'][number]) {
  if (!u.priceFrom) return 'On request';
  return u.priceTo && u.priceTo !== u.priceFrom ? `${aed(u.priceFrom)} to ${u.priceTo.toLocaleString('en-US')}` : aed(u.priceFrom);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const dev = await getDeveloper(p.developerSlug);
  const area = await getArea(areaOf(p));
  const price = priceText(p);
  const intro = copy.projectIntro(p);
  const faqs = copy.projectFaqs(p);
  const related = await relatedProjects(p);
  const tel = telHref();
  const gallery: GalleryItem[] = [
    ...(p.cover ? [{ ...p.cover, group: 'Cover' }] : []),
    ...p.gallery.map((g) => ({ ...g.image, group: g.group })),
    ...p.units.filter((u) => u.floorPlan).map((u) => ({ ...u.floorPlan!, group: 'Floor plans' })),
  ];
  const docs = p.documents.filter((d) => d !== 'other');
  const docWords = docs.map((d) => (d === 'brochure' ? 'brochure' : 'floor plans'));

  return (
    <>
      <JsonLd data={residenceSchema({ area: p.communityName, emirate: p.emirate, name: p.name, slug: p.slug, description: copy.projectDescription(p), image: p.cover?.src ?? null, lat: p.location.lat, lng: p.location.lng, developer: p.developerName, types: p.propertyTypes, priceFrom: p.priceFrom, status: p.status })} />

      <section className="on-dark relative overflow-hidden bg-datum text-sand">
        <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-[0.1]" />
        <div className="relative lg:grid lg:grid-cols-[1fr_1fr]">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[560px]">
            {p.cover ? <Image src={p.cover.src} alt={p.cover.alt} fill priority fetchPriority="high" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /> : <div aria-hidden="true" className="survey-grid absolute inset-0 bg-datum-soft opacity-80" />}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-datum/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-datum lg:via-datum/0" />
          </div>
          <div className="container-site grid content-center gap-5 py-10 lg:ml-auto lg:mr-0 lg:max-w-[640px] lg:py-16 lg:pr-12">
            <Breadcrumbs tone="dark" items={[{ name: 'Home', path: '/' }, ...(area ? [{ name: area.name, path: `/areas/${area.slug}` }] : [{ name: 'Projects', path: '/projects' }]), { name: p.name, path: `/projects/${p.slug}` }]} />
            <div className="flex flex-wrap gap-2">
              <span className={`tag ${statusTone[p.status]}`}>{statusLabel[p.status]}</span>
              <span className="tag border border-sage/40 text-sand/85">{p.completion === 'ready' ? 'Ready' : p.completion === 'upcoming' ? 'Upcoming' : 'Under construction'}</span>
              {p.hasPostHandover && p.status !== 'sold-out' ? <span className="tag border border-sage/40 text-sand/85">Post-handover plan</span> : null}
            </div>
            <h1 className="text-display !text-[clamp(2.5rem,1.8rem+2.4vw,3.75rem)]">{p.name}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sand/85">
              <span>By <Link href={`/developers/${p.developerSlug}`} className="font-semibold text-sand underline-offset-4 hover:underline">{p.developerName}</Link></span>
              <span className="flex items-center gap-1.5"><Icon name="pin" className="size-4 text-plot" /><span>{area ? <Link href={`/areas/${area.slug}`} className="underline-offset-4 hover:underline">{p.communityName}</Link> : p.communityName}, {p.emirate}</span></span>
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-sage/25 pt-6 sm:grid-cols-3">
              <Fact label={price.label} value={price.value} note={price.note} />
              <Fact label="Handover" value={p.handover.label ?? 'To be announced'} />
              <Fact label="Unit types" value={p.bedroomsLabel ?? (p.propertyTypeLabels.join(', ') || 'To be announced')} />
              <Fact label="Payment plan" value={p.paymentPlanLabel ?? 'On request'} />
              {p.totalUnits && p.availableUnits != null ? <Fact label="Units available" value={`${p.availableUnits} of ${p.totalUnits}`} /> : null}
              <Fact label="Property type" value={p.propertyTypeLabels.join(', ') || '—'} />
            </dl>
          </div>
        </div>
      </section>

      <div className="on-white bg-white">
        <div className="container-site grid grid-cols-1 gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div className="grid min-w-0 grid-cols-1 gap-16 md:gap-20">
            <section aria-labelledby="h-overview">
              <H2 id="h-overview" label="Overview">About {p.name}</H2>
              <div className="grid max-w-3xl gap-4 text-[17px]">
                {intro.map((para, i) => <p key={i} className={i === 0 ? 'text-lede' : 'text-muted'}>{para}</p>)}
              </div>
            </section>

            {gallery.length > 1 ? (
              <section aria-labelledby="h-gallery">
                <H2 id="h-gallery" label="Gallery">{p.name} in pictures</H2>
                <Gallery items={gallery} />
                <p className="mt-3 text-xs text-muted">Developer renders. The finished property may differ.</p>
              </section>
            ) : null}

            {p.units.length ? (
              <section aria-labelledby="h-units">
                <H2 id="h-units" label="Unit types">Sizes and prices</H2>
                {/* Phones: one card per unit type, so the price is never off-screen. The table takes over from 768px. */}
                <ul className="grid gap-3 md:hidden">
                  {p.units.map((u, i) => (
                    <li key={i} className="rounded-brand border border-line p-4">
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{u.type}{u.bedrooms ? ` · ${u.bedrooms === 'Studio' ? 'Studio' : `${u.bedrooms} bed`}` : ''}</span>
                        {u.floorPlan ? <a href="#h-gallery" className="shrink-0 text-sm font-semibold text-survey-deep underline underline-offset-4">Floor plan</a> : null}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-[15px]">
                        <div><dt className="text-xs text-muted">Size (sq ft)</dt><dd className="mt-0.5 tabular-nums">{sizeRange(u)}</dd></div>
                        <div><dt className="text-xs text-muted">Price (AED)</dt><dd className="mt-0.5 font-semibold tabular-nums">{p.status === 'sold-out' ? 'Sold out' : priceRange(u).replace('AED ', '')}</dd></div>
                      </dl>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto rounded-brand border border-line md:block">
                  <table className="w-full min-w-[34rem] text-left text-[15px]">
                    <caption className="sr-only">Unit types, sizes and prices at {p.name}</caption>
                    <thead>
                      <tr className="border-b border-line bg-sand text-xs uppercase tracking-[0.12em]">
                        <th scope="col" className="p-3 font-semibold">Type</th>
                        <th scope="col" className="p-3 font-semibold">Bedrooms</th>
                        <th scope="col" className="p-3 font-semibold">Size (sq ft)</th>
                        <th scope="col" className="p-3 font-semibold">Price (AED)</th>
                        <th scope="col" className="p-3 font-semibold">Floor plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.units.map((u, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="p-3 font-semibold">{u.type}</td>
                          <td className="p-3">{u.bedrooms ?? '—'}</td>
                          <td className="p-3 tabular-nums">{sizeRange(u)}</td>
                          <td className="p-3 tabular-nums">{p.status === 'sold-out' ? 'Sold out' : priceRange(u).replace('AED ', '')}</td>
                          <td className="p-3">{u.floorPlan ? <a href="#h-gallery" className="text-sm font-semibold text-survey-deep underline underline-offset-4">In gallery</a> : <span className="text-muted">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Disclaimer className="mt-3">Prices are from developer information, subject to availability, and can change.</Disclaimer>
              </section>
            ) : null}

            {p.paymentPlans.length ? (
              <section aria-labelledby="h-plans">
                <H2 id="h-plans" label="Payment">{p.paymentPlans.length > 1 ? `${p.paymentPlans.length} payment plans` : 'Payment plan'}</H2>
                <PaymentPlans plans={p.paymentPlans} />
              </section>
            ) : null}

            {p.amenities.length ? (
              <section aria-labelledby="h-amenities">
                <H2 id="h-amenities" label="Amenities">Inside the development</H2>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {p.amenities.map((a) => (
                    <li key={a.name} className="card overflow-hidden">
                      {a.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-t-[inherit] bg-line"><DeferredImage src={a.image.src} alt={a.image.alt} fill sizes="(min-width: 1024px) 240px, (min-width: 768px) 33vw, 50vw" className="object-cover" /></div> : null}
                      <div className="flex items-start gap-2 p-4">
                        {a.image ? null : <Icon name="check" className="mt-0.5 size-4 shrink-0 text-survey-deep" />}
                        <span className="grid gap-1"><span className="font-semibold leading-snug">{a.name}</span>{a.description ? <span className="text-sm text-muted">{a.description}</span> : null}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="h-location">
              <H2 id="h-location" label="Location">Where {p.name} is</H2>
              <p className="max-w-3xl text-[17px] text-muted">
                {p.name} is in {p.communityName}, {p.emirate}.{area && area.projects.length > 1 ? <> {area.projects.length - 1} other off-plan project{area.projects.length === 2 ? ' is' : 's are'} selling in the same area: <Link href={`/areas/${area.slug}`} className="link-accent">compare {area.name}</Link>.</> : null}
              </p>
              {p.nearby.length ? (
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {p.nearby.map((n) => (
                    <li key={n.name} className="flex items-center justify-between gap-4 rounded-brand border border-line px-4 py-3">
                      <span className="grid"><span className="font-semibold leading-snug">{n.name}</span>{n.category ? <span className="text-xs text-muted">{n.category}</span> : null}</span>
                      <span className="text-right text-sm tabular-nums text-muted">{[n.time, n.distance].filter(Boolean).join(' · ')}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <a href={`https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lng}`} target="_blank" rel="noopener" className="btn btn-secondary"><Icon name="map" className="size-[18px]" />Open in Google Maps</a>
                <p className="text-xs text-muted">Drive times and distances as listed by the developer.</p>
              </div>
            </section>

            <section id="brochure" aria-labelledby="h-brochure" className="relative grid gap-6 overflow-hidden rounded-brand-lg bg-plot p-6 md:grid-cols-2 md:p-10">
              <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative grid content-start gap-3">
                <p className="text-label !text-datum">Brochure</p>
                <h2 id="h-brochure" className="text-h2">{docWords.length ? `Get the ${docWords.join(' and ')}` : `Get the details for ${p.name}`}</h2>
                <p className="text-muted">{docWords.length ? `The developer’s ${docWords.join(' and ')} for ${p.name} are available. Leave your details and an advisor will send them, with current availability.` : 'Leave your details and an advisor will send what the developer has released so far.'}</p>
              </div>
              <EnquiryForm source="brochure" projectSlug={p.slug} title={`Send me the ${docWords.length ? docWords.join(' and ') : 'details'}`} submitLabel="Send it to me" compact className="relative" />
            </section>

            <section aria-labelledby="h-faq">
              <H2 id="h-faq" label="FAQ">Questions about {p.name}</H2>
              <Faq items={faqs} />
            </section>

            <div className="grid gap-1">
              <Disclaimer>Information last updated {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}, from developer information. Prices, payment plans and handover dates are subject to availability and can change. Pictures are developer renders.</Disclaimer>
            </div>
          </div>

          <aside aria-label={`Enquire about ${p.name}`} className="grid grid-cols-1 gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card grid gap-4 p-6">
              <p className="text-label">{statusLabel[p.status]}</p>
              <p className="grid"><span className="text-sm text-muted">{price.label}</span><strong className="text-figure text-[34px] leading-tight">{price.value}</strong>{price.note ? <span className="text-xs text-muted">{price.note}</span> : null}</p>
              <a href="#register" className="btn btn-primary w-full">{config.ctaLabel}</a>
              <a href="#brochure" className="btn btn-secondary w-full"><Icon name="file" className="size-[18px]" />Request the brochure</a>
              {tel ? <a href={tel} className="btn btn-dark w-full"><Icon name="phone" className="size-[18px]" />Call {contact.phone.display}</a> : null}
              {dev ? <Link href={`/developers/${dev.slug}`} className="link-accent justify-self-start text-sm">More from {dev.name} <Icon name="arrow-right" className="size-4" /></Link> : null}
              {area && area.projects.length > 1 ? <Link href={`/areas/${area.slug}`} className="link-accent -mt-2 justify-self-start text-sm">More in {area.name} <Icon name="arrow-right" className="size-4" /></Link> : null}
            </div>
            <PermitBox slug={p.slug} developerName={p.developerName} />
          </aside>
        </div>
      </div>

      {related.length ? (
        <Section id="related" tone="sand" label="Related" title={`More projects like ${p.name}`}>
          <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r, i) => <li key={r.slug} className="contents"><ProjectCard p={r} index={i} /></li>)}
          </ul>
        </Section>
      ) : null}

      <ProjectPosts slug={p.slug} name={p.name} tone="sand" />
      <RegisterBand projectSlug={p.slug} source="project" title={`Interested in ${p.name}?`} />
    </>
  );
}
