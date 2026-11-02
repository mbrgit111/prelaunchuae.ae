// npm run build:catalogue  — makes Net Capital's two project files from a full REM portal export, by hand.
// (The usual way is automatic: scripts/pull-catalogue.ts takes the list from the MBR API before every build.)
//
//   1. REMAPP_TOKEN=... npm run fetch:all       (downloads every portal project into exports/, git-ignored)
//   2. npm run build:catalogue                  (this script)
//   3. npm run check:data
//
// Keeps every public project in the portal (all emirates, selling, ready and sold out: MBR asked for all of them, 9 Oct 2026).
// Writes data/remapp-projects.json and data/remapp-projects-list.json, slimmed by src/data/slim.ts: the fields the site
// reads, a capped picture list, no private projects. A project the site's checks would reject is left out and named in
// reports/catalogue.md.
// Optional: --from <detail file> --list <list file>
import { existsSync, readFileSync } from 'node:fs';
import { slimCatalogue } from '../src/data/slim.ts';
import { writeCatalogue } from './catalogue-files.ts';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1]! : fallback;
};
const FROM = arg('from', 'exports/remapp-all-projects.json');
const LIST = arg('list', 'exports/remapp-all-list.json');
if (!existsSync(FROM) || !existsSync(LIST)) {
  console.error(`Missing ${existsSync(FROM) ? LIST : FROM}. Run "REMAPP_TOKEN=... npm run fetch:all" first.`);
  process.exit(1);
}

const all = JSON.parse(readFileSync(FROM, 'utf8')) as { fetchedAt: string; projects: unknown[] };
const list = JSON.parse(readFileSync(LIST, 'utf8')) as unknown[];

const lines = writeCatalogue(slimCatalogue(all.projects, list), {
  fetchedAt: all.fetchedAt,
  madeBy: `Made by \`npm run build:catalogue\` from the portal export of ${all.fetchedAt.slice(0, 10)}.`,
});
for (const line of lines) console.log(line);
