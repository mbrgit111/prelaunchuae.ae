'use client';

import { useId, useMemo, useState } from 'react';
import { Select } from '../ui/Select';

export interface PlanSplit { label: string; booking: number; construction: number; handover: number; postHandover: number }
export interface CalcProject { slug: string; name: string; developer: string; price: number; plans: PlanSplit[] }

const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;
const toNum = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;
// Neighbouring stages alternate light and dark (about 2:1 between each pair), as in the project page's payment plans
const STAGES = [
  { key: 'booking', label: 'On booking', tone: 'bg-gold-hover' },
  { key: 'construction', label: 'During construction', tone: 'bg-gold-deep' },
  { key: 'handover', label: 'On handover', tone: 'bg-body' },
  { key: 'postHandover', label: 'After handover', tone: 'bg-muted' },
] as const;

function Slider({ id, label, value, min, max, step, onChange, display }: {
  id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; display: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        <output htmlFor={id} className="text-sm font-semibold tabular-nums text-gold">{display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="calc-range"
        style={{ '--fill': `${pct}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[11px] tabular-nums text-muted"><span>{min.toLocaleString('en-US')}</span><span>{max.toLocaleString('en-US')}</span></div>
    </div>
  );
}

/**
 * Payment-plan and mortgage helper. Start from a real project (its price and published plans) or any price.
 * Runs in the browser only; nothing is sent anywhere. Illustrative figures.
 */
export function Calculator({ projects, presets, dldPercent }: { projects: CalcProject[]; presets: PlanSplit[]; dldPercent: number | null }) {
  const uid = useId();
  const [mode, setMode] = useState<'plan' | 'mortgage'>('plan');
  const [projectSlug, setProjectSlug] = useState('');
  const [price, setPrice] = useState(1_200_000);
  const [priceText, setPriceText] = useState('1,200,000');
  const [planIdx, setPlanIdx] = useState(0);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(25);

  const project = projects.find((p) => p.slug === projectSlug) ?? null;
  const plans = project?.plans.length ? project.plans : presets;
  const plan = plans[Math.min(planIdx, plans.length - 1)];
  const setPriceBoth = (n: number) => {
    const v = Math.max(0, Math.round(n));
    setPrice(v);
    setPriceText(v.toLocaleString('en-US'));
  };
  const pickProject = (slug: string) => {
    setProjectSlug(slug);
    setPlanIdx(0);
    const p = projects.find((x) => x.slug === slug);
    if (p) setPriceBoth(p.price);
  };

  const stages = plan ? STAGES.map((s) => ({ ...s, pct: plan[s.key], amount: (price * plan[s.key]) / 100 })).filter((s) => s.pct > 0) : [];
  const dld = dldPercent ? (price * dldPercent) / 100 : 0;
  const booking = stages.find((s) => s.key === 'booking')?.amount ?? 0;

  const m = useMemo(() => {
    const loan = price * (1 - down / 100);
    const r = rate / 100 / 12;
    const n = years * 12;
    const monthly = r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -n)) : loan / n;
    const total = monthly * n;
    const balances = Array.from({ length: Math.min(years, 25) / 5 + 1 }, (_, i) => {
      const k = i * 5 * 12;
      return { year: i * 5, balance: r > 0 ? loan * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1) : loan * (1 - k / n) };
    });
    return { loan, monthly, total, interest: total - loan, balances };
  }, [price, down, rate, years]);

  const tabBtn = 'min-h-11 flex-1 px-4 text-[13px] font-bold uppercase tracking-[0.1em] text-body transition-colors hover:text-gold-hover aria-pressed:bg-gold aria-pressed:text-on-gold sm:flex-none';
  return (
    <div className="grid overflow-hidden border border-line border-t-2 border-t-gold bg-surface lg:grid-cols-[1.05fr_1fr]">
      <div className="grid content-start gap-6 p-6 md:p-8">
        <div role="group" aria-label="Calculator" className="flex gap-1 border border-line-strong bg-band p-1">
          <button type="button" aria-pressed={mode === 'plan'} onClick={() => setMode('plan')} className={tabBtn}>Payment plan</button>
          <button type="button" aria-pressed={mode === 'mortgage'} onClick={() => setMode('mortgage')} className={tabBtn}>Mortgage</button>
        </div>

        <Select
          name="calc-project"
          label="Start from a project (optional)"
          value={projectSlug}
          onChange={pickProject}
          options={[{ value: '', label: 'Any property: set the price' }, ...projects.map((p) => ({ value: p.slug, label: `${p.name} · from ${aed(p.price)}` }))]}
        />

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${uid}-price`} className="text-sm font-semibold">Property price</label>
            {project ? <span className="text-xs text-muted">Starting price of {project.name}, subject to availability</span> : null}
          </div>
          <div className="flex items-center gap-2 border border-input-line bg-surface-2 px-4 transition-colors hover:border-gold focus-within:border-gold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--nc-focus)]">
            <span className="text-sm font-semibold text-muted">AED</span>
            <input
              id={`${uid}-price`}
              inputMode="numeric"
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value);
                setPrice(toNum(e.target.value));
              }}
              onBlur={() => setPriceBoth(price)}
              className="min-h-12 w-full bg-transparent text-lg font-semibold tabular-nums text-heading outline-none"
            />
          </div>
          <input type="range" min={300_000} max={10_000_000} step={10_000} value={Math.min(Math.max(price, 300_000), 10_000_000)} onChange={(e) => setPriceBoth(Number(e.target.value))} aria-label="Property price slider" className="calc-range" style={{ '--fill': `${((Math.min(Math.max(price, 300_000), 10_000_000) - 300_000) / 9_700_000) * 100}%` } as React.CSSProperties} />
        </div>

        {mode === 'plan' ? (
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-semibold">{project ? `${project.name} payment plans` : 'Common payment plans across the UAE'}</legend>
            <div className="flex flex-wrap gap-2">
              {plans.map((pl, i) => (
                <label key={`${pl.label}-${i}`} className="cursor-pointer">
                  <input type="radio" name={`${uid}-plan`} className="peer sr-only" checked={planIdx === i} onChange={() => setPlanIdx(i)} />
                  <span className="inline-flex min-h-11 flex-col justify-center border border-line-strong bg-gold-tint px-4 py-1.5 text-sm font-semibold tabular-nums text-body transition-colors hover:border-gold hover:text-heading peer-checked:border-gold peer-checked:bg-gold peer-checked:text-on-gold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-hover">
                    {[pl.booking, pl.construction, pl.handover, pl.postHandover].filter((n) => n > 0).map(Math.round).join('/')}
                    {project && pl.label ? <span className="max-w-[14rem] truncate text-[11px] font-normal opacity-75">{pl.label}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div className="grid gap-6">
            <Slider id={`${uid}-down`} label="Down payment" value={down} min={20} max={80} step={5} onChange={setDown} display={`${down}% · ${aed((price * down) / 100)}`} />
            <Slider id={`${uid}-rate`} label="Interest rate (example)" value={rate} min={2} max={9} step={0.05} onChange={(n) => setRate(Math.round(n * 100) / 100)} display={`${rate.toFixed(2)}%`} />
            <Slider id={`${uid}-years`} label="Term" value={years} min={5} max={25} step={1} onChange={setYears} display={`${years} years`} />
          </div>
        )}
      </div>

      <div className="on-dark grid content-start gap-6 border-t border-line bg-band p-6 text-body md:p-8 lg:border-l lg:border-t-0" aria-live="polite">
        {mode === 'plan' ? (
          <>
            <div className="grid gap-1">
              <p className="text-label">Your payments, stage by stage</p>
              <p className="text-sm text-muted">{aed(price)}{plan ? ` · ${[plan.booking, plan.construction, plan.handover, plan.postHandover].filter((n) => n > 0).map(Math.round).join('/')} plan` : ''}</p>
            </div>
            <div className="flex h-4 gap-[2px] overflow-hidden" role="img" aria-label={stages.map((s) => `${s.pct}% ${s.label.toLowerCase()}`).join(', ')}>
              {stages.map((s) => <span key={s.key} className={`${s.tone} transition-[width] duration-500 ease-brand`} style={{ width: `${s.pct}%` }} />)}
            </div>
            <ul className="grid gap-3">
              {stages.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-4 border-b border-line pb-3">
                  <span className="flex items-center gap-2.5 text-body"><span aria-hidden="true" className={`size-3 ${s.tone}`} />{s.label} <span className="tabular-nums text-muted">{s.pct}%</span></span>
                  <strong className="text-figure text-lg text-heading">{aed(s.amount)}</strong>
                </li>
              ))}
            </ul>
            {dldPercent ? (
              <div className="grid gap-2 border border-line bg-surface p-4 text-sm">
                <p className="flex justify-between gap-4"><span className="text-body">Dubai Land Department fee ({dldPercent}%)</span><strong className="tabular-nums text-heading">{aed(dld)}</strong></p>
                <p className="flex justify-between gap-4 border-t border-line pt-2"><span className="font-semibold text-gold">Due at booking, with the fee</span><strong className="tabular-nums text-gold">{aed(booking + dld)}</strong></p>
                <p className="text-xs text-muted">The fee rate is the one listed in the developers’ payment schedules. Other fees vary by developer.</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="grid gap-1">
              <p className="text-label">Estimated monthly repayment</p>
              <p className="text-figure text-[40px] leading-none text-heading md:text-[48px]">{aed(m.monthly)}</p>
              <p className="text-sm text-muted">Loan of {aed(m.loan)} over {years} years at {rate.toFixed(2)}%.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex h-4 gap-[2px] overflow-hidden" role="img" aria-label={`Principal ${Math.round((m.loan / m.total) * 100)}%, interest ${Math.round((m.interest / m.total) * 100)}%`}>
                <span className="bg-body transition-[width] duration-500 ease-brand" style={{ width: `${(m.loan / m.total) * 100}%` }} />
                <span className="bg-gold transition-[width] duration-500 ease-brand" style={{ width: `${(m.interest / m.total) * 100}%` }} />
              </div>
              <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
                <span className="flex items-center gap-2"><span aria-hidden="true" className="size-3 bg-body" />Principal <strong className="tabular-nums">{aed(m.loan)}</strong></span>
                <span className="flex items-center gap-2"><span aria-hidden="true" className="size-3 bg-gold" />Interest <strong className="tabular-nums">{aed(m.interest)}</strong></span>
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-xs text-muted">Loan balance over time</p>
              <ul className="flex h-24 items-end gap-2" aria-label="Loan balance every five years">
                {m.balances.map((b) => (
                  <li key={b.year} className="group relative flex flex-1 flex-col items-center gap-1" title={`Year ${b.year}: ${aed(b.balance)}`}>
                    <span className="w-full bg-gradient-to-t from-gold-deep to-gold transition-[height] duration-500 ease-brand" style={{ height: `${Math.max(2, (b.balance / m.loan) * 72)}px` }} />
                    <span className="text-[11px] tabular-nums text-muted">{b.year === 0 ? 'Now' : `Yr ${b.year}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-2 border border-line bg-surface p-4 text-sm">
              <p className="flex justify-between gap-4"><span className="text-body">Down payment ({down}%)</span><strong className="tabular-nums text-heading">{aed((price * down) / 100)}</strong></p>
              {dldPercent ? <p className="flex justify-between gap-4"><span className="text-body">Dubai Land Department fee ({dldPercent}%)</span><strong className="tabular-nums text-heading">{aed(dld)}</strong></p> : null}
              <p className="flex justify-between gap-4 border-t border-line pt-2"><span className="font-semibold text-gold">Cash needed upfront</span><strong className="tabular-nums text-gold">{aed((price * down) / 100 + dld)}</strong></p>
            </div>
            <p className="text-xs text-muted">Lenders set the rate, the term and the maximum loan. Off-plan stages are often paid before a mortgage can begin: ask your lender.</p>
          </>
        )}
        <a href="#register" className="btn btn-primary mt-1 justify-self-start">Send me this breakdown</a>
      </div>
    </div>
  );
}
