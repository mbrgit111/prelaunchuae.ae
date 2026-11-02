// npm run report:data  — data-field usage report + duplicate-text report (reports/data-field-usage.md, reports/duplicate-texts.md).
// Fails if the data contains a field that src/data/field-usage.ts does not list.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fieldUsage } from '../src/data/field-usage.ts';

const detail = JSON.parse(readFileSync('data/remapp-projects.json', 'utf8'));
const list = JSON.parse(readFileSync('data/remapp-projects-list.json', 'utf8'));
const COLLAPSE = /^(translations|.*\.translations|.*nameTranslations|.*roleTranslations|.*category\.name)(\.|$)/;
const counts = new Map<string, number>();
const containers = new Set<string>(); // objects and lists of objects: covered by their own fields
const empty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length);
function walk(o: unknown, prefix: string) {
  if (Array.isArray(o)) {
    for (const x of o) walk(x, `${prefix}[]`);
    return;
  }
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    let path = prefix ? `${prefix}.${k}` : k;
    const c = path.match(COLLAPSE);
    if (c) path = c[1]!;
    if (!counts.has(path)) counts.set(path, 0);
    if (!empty(v)) counts.set(path, counts.get(path)! + 1);
    if (!c && v && typeof v === 'object' && (!Array.isArray(v) || (v.length && typeof v[0] === 'object'))) containers.add(path);
    if (!c && v && typeof v === 'object') walk(v, path);
  }
}
walk({ ...detail, projects: undefined }, '');
for (const p of detail.projects) walk(p, '');
for (const p of list) walk(p, '');
counts.delete('projects');
for (const c of containers) if ([...counts.keys()].some((k) => k !== c && (k.startsWith(`${c}.`) || k.startsWith(`${c}[]`)))) counts.delete(c);

const lookup = (path: string) => {
  let key = path;
  while (key) {
    if (fieldUsage[key]) return { key, ...fieldUsage[key]! };
    const cut = Math.max(key.lastIndexOf('.'), key.lastIndexOf('[]') > key.lastIndexOf('.') ? key.lastIndexOf('[]') : -1);
    if (cut <= 0) break;
    key = key.slice(0, cut).replace(/\.$/, '');
  }
  return null;
};
const rows = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([path, n]) => ({ path, n, u: lookup(path) }));
const unmapped = rows.filter((r) => !r.u);
const usedCount = rows.filter((r) => r.u?.used).length;
mkdirSync('reports', { recursive: true });
writeFileSync(
  'reports/data-field-usage.md',
  [
    '# Data-field usage report',
    '',
    `Generated ${new Date().toISOString().slice(0, 10)} from data/remapp-projects.json (${detail.projects.length} projects) and data/remapp-projects-list.json. Mapping: src/data/field-usage.ts.`,
    '',
    `${rows.length} field paths: ${usedCount} used, ${rows.length - usedCount - unmapped.length} unused with a reason, ${unmapped.length} unmapped.`,
    '',
    '| Field | Records with a value | Used | Where it appears / why not |',
    '|---|---|---|---|',
    ...rows.map((r) => `| \`${r.path}\` | ${r.n} | ${r.u ? (r.u.used ? 'Yes' : 'No') : '**UNMAPPED**'} | ${r.u?.where ?? 'Add this field to src/data/field-usage.ts'} |`),
    '',
  ].join('\n'),
);

// duplicate-content report
const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const ncFile = '../mbr-property-sites/sites/netcapital/project-details.json';
const nc: Record<string, { description: { text?: string; items?: string[] }[] }> | null = existsSync(ncFile) ? JSON.parse(readFileSync(ncFile, 'utf8')) : null;
const ncTexts = nc ? Object.values(nc).map((d) => d.description.map((b) => b.text ?? (b.items ?? []).join(' ')).join(' ').replace(/\s+/g, ' ').trim()) : [];
const lines = detail.projects.map((p: { title: string; description: string }) => {
  const t = strip(p.description);
  const sample = t.slice(40, 140);
  const onNc = nc ? ncTexts.some((x) => x.includes(sample)) : null;
  return `| ${p.title.trim()} | ${t.length} | ${onNc === null ? 'not checked (netcapital files not found)' : onNc ? 'Yes, word for word' : 'No match found'} | Not published. Template intro used. |`;
});
writeFileSync(
  'reports/duplicate-texts.md',
  [
    '# Duplicate-content report',
    '',
    'The long developer descriptions in the data are not published on Dubai South Capital: they already appear on netcapital.ae (and on other agencies’ sites, being the developers’ own text).',
    'Each project page instead opens with a Dubai South Capital intro written from the project’s facts (sites/netcapital/copy/templates.ts), plus its own FAQ.',
    'To publish a rewritten description for a project, send the approved text and it will be added.',
    '',
    '| Project | Description length (characters) | Also on netcapital.ae | On this site |',
    '|---|---|---|---|',
    ...lines,
    '',
  ].join('\n'),
);
console.log(`Field usage: ${rows.length} paths, ${usedCount} used, ${unmapped.length} unmapped (reports/data-field-usage.md). Duplicate report: ${detail.projects.length} descriptions (reports/duplicate-texts.md)`);
if (unmapped.length) {
  console.error(`Unmapped fields: ${unmapped.map((r) => r.path).join(', ')}`);
  process.exit(1);
}
