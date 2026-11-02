import type { Metadata } from 'next';
import { AuthorIndex, authorMetadata } from '@/lib/content/listing-route';

export const revalidate = 600;
export const dynamicParams = true;

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => authorMetadata((await params).slug);

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <AuthorIndex slug={(await params).slug} />;
}
