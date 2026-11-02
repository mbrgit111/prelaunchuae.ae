import { projectIndex } from '@/data/explorer';

// Static file made at build (and refreshed with the pages). The projects explorer loads it the first time a filter is used.
export const dynamic = 'force-static';
// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;

export async function GET() {
  return new Response(JSON.stringify(await projectIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}
