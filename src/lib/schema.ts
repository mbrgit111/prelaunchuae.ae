/** JSON-LD for search engines. Contact fields appear only once they exist in contact.ts. */
import { compliance, config, contact } from '@/site';

// Absolute address for Google data. A picture's `#w=...` list of saved widths (lib/image-loader.ts) is not part of its address.
const abs = (path: string) => {
  const url = new URL(path, config.url);
  url.hash = '';
  return url.toString();
};
export const orgId = `${config.url}/#organization`;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'RealEstateAgent'],
    '@id': orgId,
    name: config.name,
    url: config.url,
    logo: abs('/android-chrome-512.png'),
    image: abs(config.ogImage.src),
    description: config.description,
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    parentOrganization: { '@type': 'Organization', name: config.operatedBy },
    ...(contact.phone.e164 ? { telephone: contact.phone.e164 } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(compliance.company.officeAddress ? { address: { '@type': 'PostalAddress', streetAddress: compliance.company.officeAddress, addressLocality: 'Dubai', addressCountry: 'AE' } } : {}),
    ...(licenceIds.length ? { identifier: licenceIds } : {}),
  };
}

const licenceIds = [
  ['RERA ORN', compliance.company.reraOrn],
  ['DLD broker number', compliance.company.dldBrokerNumber],
  ['Trade licence', compliance.company.tradeLicence],
]
  .filter(([, v]) => v)
  .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }));

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.url}/#website`,
    url: config.url,
    name: config.name,
    inLanguage: config.locale,
    publisher: { '@id': orgId },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function residenceSchema(p: {
  name: string; slug: string; description: string; image: string | null; lat: number; lng: number; developer: string; types: string[];
  priceFrom: number | null; status: string; area: string; emirate: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': p.types.length === 1 && p.types[0] === 'apartment' ? 'ApartmentComplex' : 'Residence',
    '@id': abs(`/projects/${p.slug}#residence`),
    name: p.name,
    url: abs(`/projects/${p.slug}`),
    description: p.description,
    ...(p.image ? { image: abs(p.image) } : {}),
    address: { '@type': 'PostalAddress', addressLocality: p.area, addressRegion: p.emirate, addressCountry: 'AE' },
    geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    containedInPlace: { '@type': 'Place', name: `${p.area}, ${p.emirate}` },
    brand: { '@type': 'Organization', name: p.developer },
    ...(p.priceFrom && p.status !== 'sold-out'
      ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'AED', lowPrice: p.priceFrom, availability: 'https://schema.org/InStock', seller: { '@id': orgId } } }
      : {}),
  };
}

export function articleSchema(a: { title: string; description: string; slug: string; date: string; modified?: string; type?: 'Article' | 'BlogPosting' | 'NewsArticle'; image: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': a.type ?? 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.modified ?? a.date,
    url: abs(`/blog/${a.slug}`),
    ...(a.image ? { image: abs(a.image) } : {}),
    author: { '@id': orgId },
    publisher: { '@id': orgId },
  };
}

/** An ordered list of project pages (area, developer and type pages). */
export function itemListSchema(name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.path) })),
  };
}
