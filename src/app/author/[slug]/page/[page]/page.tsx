import type { Metadata } from 'next';
import { AuthorIndex, authorMetadata } from '@/lib/content/listing-route';

export const revalidate = 600;
export const dynamicParams = true;
// Nothing is built ahead of time: each numbered page is built on its first visit, then kept (ISR) like the others.
export const generateStaticParams = () => [];

type P = { params: Promise<{ slug: string; page: string }> };
export const generateMetadata = async ({ params }: P): Promise<Metadata> => {
  const { slug, page } = await params;
  return authorMetadata(slug, page);
};

export default async function Page({ params }: P) {
  const { slug, page } = await params;
  return <AuthorIndex slug={slug} page={page} />;
}
