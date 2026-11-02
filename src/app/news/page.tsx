import type { Metadata } from 'next';
import { NewsIndex, newsMetadata } from '@/lib/content/listing-route';

export const revalidate = 600;

export const generateMetadata = (): Promise<Metadata> => newsMetadata();

export default function Page() {
  return <NewsIndex />;
}
