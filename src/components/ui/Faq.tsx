import { faqSchema } from '@/lib/schema';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { JsonLd } from './JsonLd';

/** Accordion of questions (native details/summary: keyboard and screen-reader friendly, no JavaScript) + FAQPage schema. */
export function Faq({ items, schema = true }: { items: { q: string; a: string; flag?: string }[]; schema?: boolean }) {
  return (
    <>
      {schema ? <JsonLd data={faqSchema(items)} /> : null}
      <div className="divide-y divide-line rounded-brand border border-line bg-white">
        {items.map((f, i) => (
          <details key={f.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
              <span className="text-[17px] font-semibold leading-snug">{f.q}</span>
              <Icon name="plus" className="mt-0.5 size-5 shrink-0 text-survey-deep transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <div className="-mt-1 px-5 pb-6 text-muted md:px-6">
              {f.a}
              <Flag>{f.flag}</Flag>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
