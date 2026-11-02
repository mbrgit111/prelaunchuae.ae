import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/seo';
import { pageCount, pagePath, ProjectsListing } from '@/components/pages/ProjectsListing';

// Pages 2 to 10 are made at build time; later pages the first time someone opens them.
export const dynamicParams = true;
// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;
export const generateStaticParams = async () => Array.from({ length: Math.min(9, Math.max(0, (await pageCount()) - 1)) }, (_, i) => ({ n: String(i + 2) }));

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const n = Number((await params).n);
  return pageMetadata({
    title: `New Launch Projects in Dubai and the UAE: Page ${n} of ${await pageCount()}`,
    description: `Page ${n} of the full list of new launch projects across Dubai and the UAE, with prices, payment plans and completion dates.`,
    path: pagePath(n),
    absoluteTitle: true,
  });
}

export default async function ProjectsPageN({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 2 || n > (await pageCount())) notFound();
  return <ProjectsListing page={n} />;
}
