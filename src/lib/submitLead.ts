/**
 * Every form on the site calls submitLead(). The website forwards it to the Lead API.
 */

export type LeadSource = 'hero' | 'register' | 'contact' | 'brochure' | 'quiz' | 'project';

export interface Utm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface Lead {
  /** Set by the server (src/lib/forwardLead.ts) from the site config. */
  siteTag?: string;
  source: LeadSource;
  page: string; // full URL the form was sent from
  projectSlug: string | null;
  utm: Utm;
  name: string;
  phone: string;
  email: string;
  message?: string;
  consent: boolean;
  interest?: Record<string, string>; // quiz answers
  submittedAt: string; // ISO date
}

export interface PartialLead {
  /** Set by the server (src/lib/forwardLead.ts) from the site config. */
  siteTag?: string;
  source: LeadSource;
  page: string;
  projectSlug: string | null;
  utm: Utm;
  name?: string;
  phone?: string;
  email?: string;
  disclosureText: string;
}

export type LeadResult = { ok: true } | { ok: false; error: string };

const FAIL = 'We could not send your details. Please try again or call us.';

export async function submitLead(lead: Lead): Promise<LeadResult> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(lead),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, error: data?.error?.message || FAIL };
  } catch {
    return { ok: false, error: FAIL };
  }
}

/** Fire-and-forget save of a phone or email the visitor typed but did not submit. */
export function submitPartialLead(lead: PartialLead): void {
  try {
    void fetch('/api/partial-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // A failed partial save must not interrupt the form.
  }
}
