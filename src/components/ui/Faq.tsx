import { faqSchema } from '@/lib/schema';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { JsonLd } from './JsonLd';

/** Accordion of questions (native details/summary: keyboard and screen-reader friendly, no JavaScript) + FAQPage schema. */
export function Faq({ items, schema = true }: { items: { q: string; a: string; flag?: string }[]; schema?: boolean }) {
  return (
    <>
      {schema ? <JsonLd data={faqSchema(items)} /> : null}
      <div className="divide-y divide-line border border-line bg-surface">
        {items.map((f, i) => (
          <details key={f.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 p-5 transition-colors hover:bg-surface-2 md:p-6 [&::-webkit-details-marker]:hidden">
              <span className="text-[17px] font-semibold leading-snug text-heading transition-colors group-open:text-gold-hover">{f.q}</span>
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center border border-line-strong bg-gold-tint text-gold transition-colors group-open:border-gold group-open:bg-gold group-open:text-on-gold">
                <Icon name="plus" className="size-4 transition-transform duration-200 group-open:rotate-45" />
              </span>
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
