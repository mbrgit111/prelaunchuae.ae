import { forwardLead } from '@/lib/forwardLead';

/** A finished enquiry, passed to the MBR lead desk. */
export async function POST(request: Request) {
  return forwardLead(request, '/v1/public/leads');
}
