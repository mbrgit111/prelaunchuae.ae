import { describe, expect, it } from 'vitest';
import { projectEditorial } from '../sites/prelaunchuae/copy/projects/index.ts';
import { faqSchema } from '../src/lib/schema.ts';

describe('palm-01-by-binghatti editorial', () => {
  const e = projectEditorial('palm-01-by-binghatti');

  it('sets H1 display name and Doc SEO', () => {
    expect(e?.displayName).toBe('Palm 01 by Binghatti');
    expect(e?.seo?.title).toBe(
      'Palm 01 by Binghatti, Palm Jumeirah: Payment Plan, Dates and What Is Unverified',
    );
    expect(e?.seo?.description).toMatch(/20\/48\/32/);
    expect(e?.seo?.absoluteTitle).toBe(true);
  });

  it('replaces template FAQs and emits FAQPage schema for all questions', () => {
    expect(e?.faqs).toHaveLength(10);
    expect(e?.faqs[0]?.q).toBe('Does Prelaunch publish a starting price for Palm 01 by Binghatti?');
    const schema = faqSchema(e!.faqs);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(10);
  });

  it('keeps buyer-guide body for placement above Payment Plan', () => {
    expect(e?.abovePaymentPlan.length).toBeGreaterThan(10);
    const blob = JSON.stringify(e?.abovePaymentPlan);
    expect(blob).toContain('Evidence ladder');
    expect(blob).toContain('20% / 48% / 32%');
    expect(blob).toContain('/areas/palm-jumeirah');
    expect(blob).toContain('/projects/palm-springs');
    expect(blob).toContain('/contact');
  });
});
