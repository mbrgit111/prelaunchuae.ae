import Link from 'next/link';
import { copy } from '@/site';
import { planSplit, UNIT_TABS, unitPriceFrom, unitTabs } from '@/data/insights';
import { aed } from '@/lib/format';
import { Section } from '../ui/Section';
import { Tabs } from '../ui/Tabs';

/** 10 · Unit types and payment plans: each tab prices that unit type, not the project's cheapest home. */
export async function UnitTypesPlans() {
  const u = copy.home.units;
  const tabs = await unitTabs();
  if (!tabs.length) return null;
  const panels = tabs.map((t) => {
    const spec = UNIT_TABS.find((x) => x.key === t.key)!;
    const priceOf = (p: (typeof t.projects)[number]) => unitPriceFrom(p, spec);
    const shown = t.projects
      .filter((p) => p.status !== 'sold-out')
      .sort((a, b) => (priceOf(a) ?? Number.MAX_SAFE_INTEGER) - (priceOf(b) ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 6);
    const withPlans = shown.filter((p) => p.paymentPlans[0]);
    return (
      <div key={t.key} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-4">
          <p className="text-[17px]">
            <strong className="font-semibold">{t.projects.length} project{t.projects.length === 1 ? '' : 's'}</strong> list {t.label.toLowerCase()} homes.
            {t.priceFrom ? ` Listed ${t.label.toLowerCase()} prices start from ${aed(t.priceFrom)}, subject to availability.` : ''}
            {t.areaFrom ? ` Most listed sizes fall between ${t.areaFrom.toLocaleString('en-US')} and ${t.areaTo!.toLocaleString('en-US')} sq ft.` : ''}
          </p>
          <ul className="divide-y divide-line rounded-brand border border-line bg-white">
            {shown.map((p) => {
              const price = priceOf(p);
              return (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-sand">
                    <span className="grid">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-sm text-muted">{p.developerName}</span>
                    </span>
                    <span className="text-right text-sm tabular-nums">{price ? aed(price) : 'On request'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href={`/projects?beds=${t.key}`} className="btn btn-secondary btn-sm">See all {t.label.toLowerCase()}</Link>
        </div>
        {withPlans.length ? (
          <div className="overflow-x-auto rounded-brand border border-line bg-white">
            <table className="w-full min-w-[30rem] text-left text-[15px]">
              <caption className="p-4 text-left text-label">{u.planTitle}</caption>
              <thead>
                <tr className="border-y border-line bg-sand text-xs uppercase tracking-[0.12em] text-ink">
                  <th scope="col" className="sticky left-0 bg-sand p-3 font-semibold">Project</th>
                  <th scope="col" className="p-3 text-right font-semibold">Booking</th>
                  <th scope="col" className="p-3 text-right font-semibold">Construction</th>
                  <th scope="col" className="p-3 text-right font-semibold">Handover</th>
                  <th scope="col" className="p-3 text-right font-semibold">After</th>
                </tr>
              </thead>
              <tbody>
                {withPlans.map((p) => {
                  const pl = p.paymentPlans[0]!;
                  return (
                    <tr key={p.slug} className="border-b border-line last:border-0">
                      <th scope="row" className="sticky left-0 bg-white p-3 font-semibold">{p.name}{p.paymentPlans.length > 1 ? <span className="block text-xs font-normal text-muted">1 of {p.paymentPlans.length} plans ({planSplit(pl)})</span> : null}</th>
                      <td className="p-3 text-right tabular-nums">{pl.split.booking}%</td>
                      <td className="p-3 text-right tabular-nums">{pl.split.construction}%</td>
                      <td className="p-3 text-right tabular-nums">{pl.split.handover}%</td>
                      <td className="p-3 text-right tabular-nums">{pl.split.postHandover ? `${pl.split.postHandover}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    );
  });
  return (
    <Section id="unit-types" tone="white" label={u.label} title={u.title}>
      <Tabs ariaLabel="Unit types" labels={tabs.map((t) => t.label)} panels={panels} />
    </Section>
  );
}
