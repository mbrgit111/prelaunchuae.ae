'use client';

import { useId, useRef, useState } from 'react';
import { submitLead, submitPartialLead, type LeadSource } from '@/lib/submitLead';
import { readUtm } from '@/lib/utm';
// The site config only (names, no copy), so the form stays small in the browser.
import { config } from '@sites/prelaunchuae/site.config';
import { validateEmail, validateLead, validateName, validatePhone, type FieldErrors } from '@/lib/validate';

type Field = 'name' | 'phone' | 'email';
const checks: Record<Field, (v: string) => string | undefined> = { name: validateName, phone: validatePhone, email: validateEmail };
const DISCLOSURE = 'We may contact you about this enquiry using the details you enter.';

interface Props {
  source: LeadSource;
  title: string;
  intro?: string;
  submitLabel?: string;
  projectSlug?: string | null;
  interest?: Record<string, string>;
  withMessage?: boolean;
  tone?: 'light' | 'dark';
  headingLevel?: 'h2' | 'h3';
  privacyHref?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Enquiry form: validation, loading and thank-you states. It calls submitLead(), which posts to the Lead API.
 * Hidden fields passed on: siteTag, page URL, projectSlug and UTM tags. "mbr_hp" is a honeypot for bots.
 */
export function EnquiryForm({
  source, title, intro, submitLabel = 'Register interest', projectSlug = null, interest, withMessage = false,
  tone = 'light', headingLevel = 'h3', privacyHref = '/privacy', className = '', compact = false,
}: Props) {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const [values, setValues] = useState({ name: '', phone: '', email: '', message: '', consent: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const doneRef = useRef<HTMLDivElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  const sentPartial = useRef('');
  const H = headingLevel;
  const dark = tone === 'dark';

  function capturePartial(field: 'phone' | 'email') {
    if (finished.current) return;
    if (hpRef.current?.value.trim()) return;
    const phone = validatePhone(values.phone) ? '' : values.phone.trim();
    const email = validateEmail(values.email) ? '' : values.email.trim();
    if (field === 'phone' && !phone) return;
    if (field === 'email' && !email) return;
    const name = values.name.trim();
    const signature = `${phone}\n${email}\n${name}`;
    if (signature === sentPartial.current) return;
    sentPartial.current = signature;
    submitPartialLead({
      source,
      page: window.location.href,
      projectSlug,
      utm: readUtm(),
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      disclosureText: DISCLOSURE,
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if ((form.elements.namedItem('mbr_hp') as HTMLInputElement | null)?.value) {
      setStatus('done');
      return;
    }
    const errs = validateLead(values);
    setErrors(errs);
    const first = (['name', 'phone', 'email', 'consent'] as const).find((k) => errs[k]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    setStatus('sending');
    const res = await submitLead({
      source,
      page: window.location.href,
      projectSlug,
      utm: readUtm(),
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      ...(withMessage && values.message.trim() ? { message: values.message.trim() } : {}),
      consent: values.consent,
      ...(interest ? { interest } : {}),
      submittedAt: new Date().toISOString(),
    });
    if (res.ok) {
      finished.current = true;
      setStatus('done');
      requestAnimationFrame(() => doneRef.current?.focus());
    } else {
      setStatus('error');
      setError(res.error);
    }
  }

  const box = dark ? 'on-dark bg-datum-soft text-white border-white/10' : 'bg-white text-ink border-line';
  const input = `w-full rounded-brand-sm border px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 ${
    dark ? 'border-white/20 bg-datum text-white focus-visible:outline-plot' : 'border-line-strong bg-white text-ink focus-visible:outline-survey'
  }`;

  if (status === 'done') {
    const firstName = values.name.trim().split(/\s+/)[0];
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className={`rounded-brand-lg border p-6 outline-none md:p-8 ${box} ${className}`}>
        <svg viewBox="0 0 48 48" className="size-12" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="none" stroke="#E07A2E" strokeWidth="2" /><path d="m15 25 6 6 12-14" fill="none" stroke="#E07A2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <p className="text-h3 mt-4">Thank you{firstName ? `, ${firstName}` : ''}.</p>
        <p className={`mt-2 ${dark ? 'text-white/75' : 'text-muted'}`}>An advisor will be in touch shortly with current availability, floor plans and payment plans.</p>
      </div>
    );
  }

  const field = (f: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="grid gap-1.5">
      <label htmlFor={id(f)} className="text-sm font-semibold">{label}</label>
      <input
        id={id(f)}
        name={f}
        className={`${input} ${errors[f] ? '!border-[#B42318]' : ''}`}
        value={values[f]}
        onChange={(e) => {
          const v = e.target.value;
          setValues((s) => ({ ...s, [f]: v }));
          if (errors[f]) setErrors((x) => ({ ...x, [f]: checks[f](v) }));
        }}
        onBlur={() => {
          if (values[f]) setErrors((x) => ({ ...x, [f]: checks[f](values[f]) }));
          if (f === 'phone' || f === 'email') capturePartial(f);
        }}
        aria-invalid={errors[f] ? true : undefined}
        aria-describedby={errors[f] ? id(`${f}-err`) : undefined}
        required
        {...props}
      />
      {errors[f] ? <p id={id(`${f}-err`)} className={`text-sm ${dark ? 'text-[#FDA29B]' : 'text-[#B42318]'}`}>{errors[f]}</p> : null}
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className={`relative grid gap-4 rounded-brand-lg border p-6 md:p-7 ${box} ${className}`} aria-labelledby={id('title')}>
      <div>
        <H id={id('title')} className="text-h3">{title}</H>
        {intro ? <p className={`mt-1.5 text-[15px] ${dark ? 'text-white/70' : 'text-muted'}`}>{intro}</p> : null}
      </div>
      {field('name', 'Full name', { autoComplete: 'name', placeholder: 'Your name' })}
      <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+971 50 000 0000' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'name@example.com' })}
      </div>
      {withMessage ? (
        <div className="grid gap-1.5">
          <label htmlFor={id('message')} className="text-sm font-semibold">Message <span className={dark ? 'text-sand/80' : 'text-muted'}>(optional)</span></label>
          <textarea id={id('message')} name="message" rows={4} className={input} value={values.message} onChange={(e) => setValues((s) => ({ ...s, message: e.target.value }))} placeholder="Unit type, budget, timing…" />
        </div>
      ) : null}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={id('mbr_hp')}>Leave blank</label>
        <input ref={hpRef} id={id('mbr_hp')} name="mbr_hp" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <p className={`text-sm ${dark ? 'text-white/70' : 'text-muted'}`}>{DISCLOSURE}</p>
      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            id={id('consent')}
            type="checkbox"
            checked={values.consent}
            onChange={(e) => {
              setValues((s) => ({ ...s, consent: e.target.checked }));
              if (errors.consent) setErrors((x) => ({ ...x, consent: e.target.checked ? undefined : x.consent }));
            }}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? id('consent-err') : undefined}
            className={`mt-0.5 size-5 shrink-0 ${dark ? 'accent-plot' : 'accent-survey'}`}
          />
          <span className={dark ? 'text-sand/80' : 'text-muted'}>
            I agree to be contacted by {config.name} about off-plan properties in the {config.community.name}. See the <a href={privacyHref} className="underline underline-offset-2">privacy policy</a>.
          </span>
        </label>
        {errors.consent ? <p id={id('consent-err')} className={`text-sm ${dark ? 'text-[#FDA29B]' : 'text-[#B42318]'}`}>{errors.consent}</p> : null}
      </div>
      <button type="submit" disabled={status === 'sending'} className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-80">
        {status === 'sending' ? (
          <>
            <svg viewBox="0 0 24 24" className="size-5 animate-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            Sending…
          </>
        ) : (
          submitLabel
        )}
      </button>
      {status === 'error' ? <p role="alert" className="text-sm text-[#B42318]">{error}</p> : null}
      <p aria-live="polite" className="sr-only">{status === 'sending' ? 'Sending your details' : ''}</p>
    </form>
  );
}
