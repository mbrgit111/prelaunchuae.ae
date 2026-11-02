import { forwardLead } from '@/lib/forwardLead';

/** A phone or email typed but not yet sent, passed to the MBR lead desk. */
export async function POST(request: Request) {
  return forwardLead(request, '/v1/public/partial-leads');
}
