'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { EnquiryForm } from './EnquiryForm';

const STEPS = [
  { key: 'type', q: 'What are you looking for?', options: [{ v: 'apartment', l: 'An apartment' }, { v: 'townhouse-villa', l: 'A townhouse or villa' }, { v: 'any', l: 'Not sure yet' }] },
  { key: 'bedrooms', q: 'How many bedrooms?', options: [{ v: 'studio', l: 'Studio' }, { v: '1', l: '1 bedroom' }, { v: '2', l: '2 bedrooms' }, { v: '3', l: '3 or more' }] },
  { key: 'budget', q: 'What is your budget?', options: [{ v: 'under-1m', l: 'Under AED 1M' }, { v: '1m-2m', l: 'AED 1M to 2M' }, { v: '2m-3m', l: 'AED 2M to 3M' }, { v: '3m-plus', l: 'AED 3M and above' }] },
  { key: 'timing', q: 'When do you want the keys?', options: [{ v: 'ready', l: 'Ready now' }, { v: 'within-2-years', l: 'Within 2 years' }, { v: 'later', l: 'Later is fine' }, { v: 'flexible', l: 'Flexible' }] },
] as const;

/** "Find your project in 2 minutes": four questions, then a matching-projects link and the enquiry form. */
export function Quiz() {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step >= STEPS.length;
  const current = STEPS[Math.min(step, STEPS.length - 1)]!;

  const query = new URLSearchParams();
  if (answers.type === 'apartment') query.set('type', 'apartment');
  if (answers.type === 'townhouse-villa') query.set('type', 'townhouse');
  if (answers.budget) query.set('budget', answers.budget);
  if (answers.timing === 'ready') query.set('handover', 'ready');
  const labelled = Object.fromEntries(
    STEPS.filter((s) => answers[s.key]).map((s) => [s.key, s.options.find((o) => o.v === answers[s.key])!.l]),
  );

  if (done) {
    return (
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="grid content-start gap-4">
          <p className="text-label">Your answers</p>
          <ul className="grid gap-2">
            {STEPS.map((s) => (
              <li key={s.key} className="flex justify-between gap-4 border-b border-line pb-2 text-[15px]">
                <span className="text-muted">{s.q}</span>
                <strong className="text-right font-semibold">{labelled[s.key]}</strong>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/projects${query.size ? `?${query}` : ''}`} className="btn btn-dark">See matching projects</Link>
            <button type="button" onClick={() => { setStep(0); setAnswers({}); }} className="btn btn-secondary">Start again</button>
          </div>
        </div>
        <EnquiryForm source="quiz" title="Send me my shortlist" intro="We will match your answers to current availability." interest={labelled} submitLabel="Send my shortlist" />
      </div>
    );
  }

  return (
    <div className="rounded-brand-lg border border-line bg-white p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-label">Question {step + 1} of {STEPS.length}</p>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => <span key={s.key} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-survey' : 'bg-line'}`} />)}
        </div>
      </div>
      <fieldset>
        <legend className="text-h3 mb-5">{current.q}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {current.options.map((o) => (
            <label key={o.v} className="cursor-pointer">
              <input
                type="radio"
                name={`${uid}-${current.key}`}
                value={o.v}
                className="peer sr-only"
                checked={answers[current.key] === o.v}
                onChange={() => {
                  setAnswers((a) => ({ ...a, [current.key]: o.v }));
                  setStep((s) => s + 1);
                }}
              />
              <span className="flex min-h-14 items-center rounded-brand border border-line px-5 font-semibold transition-colors hover:border-ink peer-checked:border-ink peer-checked:bg-sand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-survey-deep">
                {o.l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {step > 0 ? <button type="button" onClick={() => setStep((s) => s - 1)} className="link-accent mt-6">← Back</button> : null}
    </div>
  );
}
