import { LegalPage, legalMetadata } from '@/components/pages/LegalPage';

export const metadata = legalMetadata('terms');
export default function Page() {
  return <LegalPage slug="terms" />;
}
