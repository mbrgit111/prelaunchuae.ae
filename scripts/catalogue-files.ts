// Writes PrelaunchUAE's two project files and reports/catalogue.md. Shared by pull-catalogue.ts (from the MBR API) and
// build-catalogue.ts (from a REM export), so both leave exactly the same files behind.
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import type { SlimCatalogue } from '../src/data/slim.ts';

/** `madeBy` is the first line of the report: which command made the files, and from what. Returns the lines to print. */
export function writeCatalogue(cut: SlimCatalogue, meta: { fetchedAt: string; madeBy: string }): string[] {
  const { projects, list, leftOut } = cut;
  // Written to a temporary file and renamed, so a reader never sees a half-written file.
  const writeWhole = (file: string, text: string) => { writeFileSync(`${file}.tmp`, text); renameSync(`${file}.tmp`, file); };
  writeWhole('data/remapp-projects.json', JSON.stringify({ fetchedAt: meta.fetchedAt, source: 'off-plan.remapp.ae', scope: 'pre-launch projects (REM New launch and Coming soon), all emirates', count: projects.length, projects }));
  writeWhole('data/remapp-projects-list.json', JSON.stringify(list));

  const by = (key: string) => projects.reduce<Record<string, number>>((m, p) => ((m[String(p[key])] = (m[String(p[key])] ?? 0) + 1), m), {});
  const areas = Object.entries(by('districtName')).sort((a, b) => b[1] - a[1]);
  const developers = new Set(projects.map((p) => (p.developer as { name?: unknown }).name));
  const lines = [
    '# Project catalogue',
    '',
    meta.madeBy,
    '',
    `Kept: **${projects.length}** projects in **${areas.length}** areas from **${developers.size}** developers.`,
    '',
    '| Emirate | New launch | Coming soon | All |',
    '|---|---|---|---|',
    ...Object.entries(by('emirateName')).sort((a, b) => b[1] - a[1]).map(([e, n]) => {
      const soon = projects.filter((p) => p.emirateName === e && p.status === 'pending').length;
      return `| ${e} | ${n - soon} | ${soon} | ${n} |`;
    }),
    '',
    '## Left out',
    '',
    ...(Object.keys(leftOut).length
      ? Object.entries(leftOut).map(([why, names]) => `- ${why}: ${names.length}${names.length <= 12 ? ` (${names.join(', ')})` : ''}`)
      : ['- nothing']),
    '',
    '## Areas',
    '',
    '| Area | Projects |',
    '|---|---|',
    ...areas.map(([name, n]) => `| ${name} | ${n} |`),
    '',
  ];
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/catalogue.md', lines.join('\n'));
  return [
    `Kept ${projects.length} projects (${projects.filter((p) => p.status === 'launch').length} new launch, ${projects.filter((p) => p.status === 'pending').length} coming soon) in ${areas.length} areas from ${developers.size} developers.`,
    ...Object.entries(leftOut).map(([why, names]) => `  left out, ${why}: ${names.length}`),
    'Details: reports/catalogue.md',
  ];
}
