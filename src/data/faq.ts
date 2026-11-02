import 'server-only';
import { copy } from '@/site';
import { faqFacts } from './insights.ts';

export async function marketFaqsFor() {
  return copy.marketFaqs(await faqFacts());
}
