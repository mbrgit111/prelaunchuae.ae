import type { Metadata } from 'next';
import { pageMetadata, clip } from '@/lib/seo';
import { TypePage, projectsOfType, typeSummary } from '@/components/pages/TypePage';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Off-Plan Apartments in Dubai and the UAE',
    description: clip(typeSummary('Apartments', await projectsOfType('apartment'))),
    path: '/apartments',
  });
}

export default function Page() {
  return <TypePage type="apartment" />;
}
