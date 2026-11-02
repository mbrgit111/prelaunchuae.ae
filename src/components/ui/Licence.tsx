import Image from 'next/image';
import { compliance } from '@/site';
import { showPlaceholders } from '@/lib/contact';
import { Ph } from './Placeholder';

/** Licence and registration lines from sites/<site>/compliance.ts. Missing values are not shown (preview: a marker). */
export function licenceItems(): { label: string; value: string | null; ph: string }[] {
  const c = compliance.company;
  return [
    { label: 'RERA ORN', value: c.reraOrn, ph: 'RERA ORN' },
    { label: 'DLD broker no.', value: c.dldBrokerNumber, ph: 'DLD broker number' },
    { label: 'Trade licence', value: c.tradeLicence ? `${c.tradeLicence}${c.tradeLicenceIssuer ? ` (${c.tradeLicenceIssuer})` : ''}` : null, ph: 'Trade licence' },
    { label: 'Office', value: c.officeAddress, ph: 'Office address' },
  ];
}

/** One line of licence details for the footer. */
export function LicenceLine() {
  const items = licenceItems().filter((i) => i.value || showPlaceholders);
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1">
      {items.map((i) => (
        <li key={i.label}><span className="text-white/85">{i.label}:</span> {i.value ?? <Ph label={i.ph} />}</li>
      ))}
    </ul>
  );
}

/** Licence details as a definition list (About and Contact pages; Contact shows the office in its own row). */
export function LicenceList({ className = '', withOffice = true }: { className?: string; withOffice?: boolean }) {
  const items = licenceItems().filter((i) => (withOffice || i.label !== 'Office') && (i.value || showPlaceholders));
  if (!items.length) return null;
  return (
    <dl className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {items.map((i) => (
        <div key={i.label} className="grid gap-0.5 border-t border-line pt-3">
          <dt className="text-sm text-muted">{i.label}</dt>
          <dd className="font-semibold">{i.value ?? <Ph label={i.ph} />}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The project's advertising permit (DLD Trakheesi): permit number, Madmoun QR code, developer, RERA project number, escrow. */
export function PermitBox({ slug, developerName }: { slug: string; developerName: string }) {
  const p = compliance.projectPermits[slug];
  if (!p && !showPlaceholders) return null;
  const rows: [string, string | null, string][] = [
    ['Trakheesi permit', p?.trakheesiPermit ?? null, 'Trakheesi permit number'],
    ['Developer', developerName, 'Developer'],
    ['RERA project no.', p?.reraProjectNumber ?? null, 'RERA project number'],
    ['Escrow account', p?.escrowAccount ?? null, 'Escrow account'],
  ];
  return (
    <section aria-labelledby={`permit-${slug}`} className="card grid gap-4 p-6">
      <h2 id={`permit-${slug}`} className="text-label">Advertising permit</h2>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <dl className="grid gap-2 text-sm">
          {rows.filter(([, v]) => v || showPlaceholders).map(([label, value, ph]) => (
            <div key={label} className="grid">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold break-words">{value ?? <Ph label={ph} />}</dd>
            </div>
          ))}
        </dl>
        {p?.madmounQr ? (
          <Image src={p.madmounQr} alt={`Madmoun QR code for permit ${p.trakheesiPermit}`} width={96} height={96} className="rounded-md border border-line" />
        ) : showPlaceholders ? <Ph label="QR code" /> : null}
      </div>
    </section>
  );
}
