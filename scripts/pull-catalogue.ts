// Before every build: copies Net Capital's project list from the MBR API (the database the desk's "Update properties"
// keeps in step with REM) into data/remapp-projects.json and data/remapp-projects-list.json.
// The API holds every project whole. src/data/slim.ts makes Net Capital's lighter cut on the way in, so the picture step
// that runs next (scripts/sync-images.mjs) downloads exactly what the pages will show.
//
// The saved files are kept, and the build carries on with them, when the API cannot be reached, has no projects for this
// site yet, or holds far fewer than the saved files (an update that was stopped part-way). The site never shrinks or
// goes empty because of a bad day at the API.
//   npm run pull:catalogue                  (also runs automatically before every build)
//   CATALOGUE_SOURCE=files npm run build    (skip the API and build from the saved files)
//   CATALOGUE_ALLOW_FEWER=1 npm run build   (accept a much shorter list, after projects were removed in the desk on purpose)
import { existsSync, readFileSync } from 'node:fs';
import { LIVE_API } from '../src/lib/content/settings.ts';
import { inRemOrder, slimCatalogue } from '../src/data/slim.ts';
import { writeCatalogue } from './catalogue-files.ts';

if (process.env.CATALOGUE_SOURCE === 'files') {
  console.log('Project list: using the saved files (CATALOGUE_SOURCE=files).');
  process.exit(0);
}

const DETAIL = 'data/remapp-projects.json';
// A build always reads the live desk unless told otherwise (the same settings the site itself uses).
const url = (process.env.CONTENT_API_URL || process.env.LEAD_API_URL || process.env.NEXT_PUBLIC_LEAD_API_URL || LIVE_API.url).replace(/\/$/, '');
const key = process.env.CONTENT_SITE_KEY || process.env.LEAD_SITE_KEY || process.env.NEXT_PUBLIC_LEAD_SITE_KEY || LIVE_API.key;
const saved = existsSync(DETAIL) ? (JSON.parse(readFileSync(DETAIL, 'utf8')) as { fetchedAt?: string; projects?: unknown[] }) : null;
const savedCount = saved?.projects?.length ?? 0;
const keepSaved = (why: string) => {
  console.log(`Project list: ${why}; building from the saved files (${savedCount} projects, list of ${saved?.fetchedAt?.slice(0, 10) ?? 'never'}).`);
  process.exit(0);
};

let body: { fetchedAt?: unknown; projects: unknown[] } | null = null;
for (let attempt = 1; attempt <= 3 && !body; attempt++) {
  try {
    const res = await fetch(`${url}/v1/public/catalogue`, {
      headers: { 'X-Site-Key': key, Accept: 'application/json' },
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { fetchedAt?: unknown; projects?: unknown };
    if (!Array.isArray(json.projects)) throw new Error('no project list in the answer');
    body = { fetchedAt: json.fetchedAt, projects: json.projects };
  } catch (e) {
    console.log(`Project list: API attempt ${attempt} failed (${(e as Error).message}).`);
  }
}
if (!body) keepSaved('the API could not be reached');
else if (!body.projects.length) keepSaved('the API has no projects for this site yet');
else {
  const cut = slimCatalogue(inRemOrder(body.projects));
  // "Update properties" never removes a project, so a list much shorter than the saved one is a half-finished first
  // update, not the market shrinking. Publishing it would take most project pages off the site.
  if (cut.projects.length < savedCount * 0.9 && !process.env.CATALOGUE_ALLOW_FEWER) {
    keepSaved(`the API holds only ${cut.projects.length} usable projects against ${savedCount} saved, which looks like an update that did not finish`);
  }
  const fetchedAt = typeof body.fetchedAt === 'string' && !Number.isNaN(Date.parse(body.fetchedAt)) ? new Date(body.fetchedAt).toISOString() : new Date().toISOString();
  const lines = writeCatalogue(cut, {
    fetchedAt,
    madeBy: `Made by \`npm run pull:catalogue\` from the MBR desk's project list, last checked against REM on ${fetchedAt.slice(0, 10)}.`,
  });
  const change = cut.projects.length - savedCount;
  console.log(`Project list: ${cut.projects.length} projects from the API (${change >= 0 ? '+' : ''}${change} against the saved files).`);
  for (const line of lines.slice(1)) console.log(line);
}
