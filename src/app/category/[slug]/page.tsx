import type { Metadata } from 'next';
import { CategoryIndex, categoryMetadata } from '@/lib/content/listing-route';
import { getCategories } from '@/lib/content';

export const revalidate = 600;
export const dynamicParams = true;

export const generateStaticParams = async () => (await getCategories()).map((c) => ({ slug: c.slug }));
export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => categoryMetadata((await params).slug);

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryIndex slug={(await params).slug} />;
}
