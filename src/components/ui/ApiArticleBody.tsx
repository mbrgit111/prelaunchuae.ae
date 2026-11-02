import type { Project } from '@/data';
import { Body, type HeadingRef } from '@/components/content/Body';
import { Faq } from './Faq';

/** Article text written in the MBR desk, drawn from its structured form (see components/content/Body.tsx). */
export function ApiArticleBody({ doc, headings, faq, projects = [] }: { doc: unknown; headings: HeadingRef[]; faq: { q: string; a: string }[]; projects?: Project[] }) {
  return (
    <>
      <Body doc={doc} headings={headings} projects={projects} />
      {faq.length > 0 ? <Faq items={faq} schema={false} /> : null}
    </>
  );
}
