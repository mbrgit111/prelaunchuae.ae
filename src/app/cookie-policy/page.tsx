import { LegalPage, legalMetadata } from '@/components/pages/LegalPage';

export const metadata = legalMetadata('cookie-policy');
export default function Page() {
  return <LegalPage slug="cookie-policy" />;
}
