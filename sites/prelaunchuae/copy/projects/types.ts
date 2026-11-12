import type { PostBlock } from '../../../../src/data/types.ts';

/** Hand-written copy for one project page. Gallery, unit table, payment UI, map and forms stay. */
export interface ProjectEditorial {
  /** Exact H1 (and last breadcrumb) when the portal name casing is wrong. */
  displayName?: string;
  seo?: {
    title: string;
    description: string;
    /** When true, do not append " | OffPlan". */
    absoluteTitle?: boolean;
  };
  /** Replaces the template About paragraphs. */
  intro: string[];
  /** Shown under the About lede (e.g. last-updated line). */
  introNote?: string;
  /** Rich blocks rendered immediately above the Payment Plan section. */
  abovePaymentPlan: PostBlock[];
  /** Replaces template FAQs (Faq component emits FAQPage schema). */
  faqs: { q: string; a: string }[];
}
