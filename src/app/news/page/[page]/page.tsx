import type { Metadata } from 'next';
import { NewsIndex, newsMetadata } from '@/lib/content/listing-route';

export const revalidate = 600;
export const dynamicParams = true;
// Nothing is built ahead of time: each numbered page is built on its first visit, then kept (ISR) like the others.
export const generateStaticParams = () => [];

export const generateMetadata = async ({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> => newsMetadata((await params).page);

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  return <NewsIndex page={(await params).page} />;
}
