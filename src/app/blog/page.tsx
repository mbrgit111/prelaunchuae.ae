import type { Metadata } from 'next';
import { BlogIndex, blogMetadata } from '@/lib/content/listing-route';

export const revalidate = 600;

export const generateMetadata = (): Promise<Metadata> => blogMetadata();

export default function Page() {
  return <BlogIndex />;
}
