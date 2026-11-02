import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { clip, pageMetadata } from '@/lib/seo';
import { BEDROOMS, TypePage, projectsOfType, typeSummary } from '@/components/pages/TypePage';

export const dynamicParams = false;
export async function generateStaticParams() {
  const params: { bedrooms: string }[] = [];
  for (const bedroom of BEDROOMS) {
    if ((await projectsOfType('apartment', bedroom.match)).length) params.push({ bedrooms: bedroom.slug });
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ bedrooms: string }> }): Promise<Metadata> {
  const { bedrooms } = await params;
  const b = BEDROOMS.find((x) => x.slug === bedrooms);
  if (!b) return {};
  const title = b.label.charAt(0).toUpperCase() + b.label.slice(1);
  return pageMetadata({ title: `Off-Plan ${title} in the UAE`, description: clip(typeSummary(b.label, await projectsOfType('apartment', b.match))), path: `/apartments/${b.slug}` });
}

export default async function Page({ params }: { params: Promise<{ bedrooms: string }> }) {
  const { bedrooms } = await params;
  const b = BEDROOMS.find((x) => x.slug === bedrooms);
  if (!b) notFound();
  return <TypePage type="apartment" bedrooms={b} />;
}
