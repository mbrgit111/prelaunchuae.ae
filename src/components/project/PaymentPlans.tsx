import { Fragment } from 'react';
import type { PaymentPlan } from '@/data';
import { aed } from '@/lib/format';

const pct = (n: number | null) => (n == null ? '—' : `${Number.isInteger(n) ? n : n.toFixed(1)}%`);
const STAGES = [
  { key: 'booking', label: 'On booking', tone: 'bg-survey-deep' },
  { key: 'construction', label: 'During construction', tone: 'bg-survey' },
  { key: 'handover', label: 'On handover', tone: 'bg-datum' },
  { key: 'postHandover', label: 'After handover', tone: 'bg-muted' },
] as const;

function Plan({ plan }: { plan: PaymentPlan }) {
  const parts = STAGES.map((s) => ({ ...s, value: plan.split[s.key], payments: plan.instalments[s.key] })).filter((s) => s.value > 0);
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={parts.map((s) => `${pct(s.value)} ${s.label.toLowerCase()}`).join(', ')}>
        {parts.map((s) => <span key={s.key} className={s.tone} style={{ width: `${s.value}%` }} />)}
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {parts.map((s) => (
          <div key={s.key} className="grid content-start gap-1">
            <dt className="flex items-center gap-2 text-sm text-muted"><span aria-hidden="true" className={`size-2.5 rounded-sm ${s.tone}`} />{s.label}</dt>
            <dd className="text-2xl font-light tabular-nums">{pct(s.value)}</dd>
            {s.payments ? <dd className="text-xs text-muted">{s.payments} instalment{s.payments === 1 ? '' : 's'}</dd> : null}
          </div>
        ))}
      </dl>
      {plan.milestones.length ? (
        <div className="overflow-x-auto rounded-brand border border-line">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Payment schedule: {plan.title}</caption>
            <thead>
              <tr className="border-b border-line bg-sand text-xs uppercase tracking-[0.12em]">
                <th scope="col" className="p-3 font-semibold">Stage</th>
                <th scope="col" className="p-3 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {plan.milestones.map((m, mi) => (
                <Fragment key={`${m.title}-${mi}`}>
                  <tr className="border-b border-line bg-white">
                    <th scope="row" className="p-3 font-semibold">{m.title}</th>
                    <td className="p-3 text-right font-semibold tabular-nums">{pct(m.percent)}</td>
                  </tr>
                  {m.steps.map((st, i) => (
                    <tr key={`${mi}-${i}`} className="border-b border-line text-muted last:border-0">
                      <td className="py-2 pl-7 pr-3">{st.title}{st.isFee ? <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink">Fee</span> : null}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{st.fixedAmount ? aed(st.fixedAmount) : pct(st.percent)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/** Every published payment plan: the default plan open, the rest one click away. */
export function PaymentPlans({ plans }: { plans: PaymentPlan[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {plans.map((pl, i) => (
        <details key={`${pl.title}-${i}`} open={i === 0} className="group rounded-brand border border-line bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6 [&::-webkit-details-marker]:hidden">
            <span className="grid gap-0.5">
              <span className="font-semibold">{pl.title}</span>
              <span className="text-sm tabular-nums text-muted">{[pl.split.booking, pl.split.construction, pl.split.handover, pl.split.postHandover].filter((n) => n > 0).map(pct).join(' / ')}</span>
            </span>
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-survey-deep transition-transform duration-200 group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </summary>
          <div className="border-t border-line p-5 md:p-6"><Plan plan={pl} /></div>
        </details>
      ))}
    </div>
  );
}
