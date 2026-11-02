import { LegalPage, legalMetadata } from '@/components/pages/LegalPage';

export const metadata = legalMetadata('privacy');
export default function Page() {
  return <LegalPage slug="privacy" />;
}
