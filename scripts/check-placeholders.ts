// npm run check:placeholders  — lists every contact detail still missing from sites/<site>/contact.ts.
// With --build (runs before every build): on the LIVE build (SITE_ENV=production or VERCEL_ENV=production)
// a missing required value, or PREVIEW_PLACEHOLDERS=true, stops the build. Preview builds only warn.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contactFields, isFilled } from '../sites/contact-fields.ts';

const site = process.env.NEXT_PUBLIC_SITE ?? 'prelaunchuae';
const { contact } = await import(`../sites/${site}/contact.ts`);
const live = process.env.SITE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const building = process.argv.includes('--build');

const missing = contactFields.filter((f) => !isFilled(f.value(contact)));
const missingRequired = missing.filter((f) => f.required);

if (!building || missing.length) {
  console.log(`Contact details for "${site}" (sites/${site}/contact.ts):`);
  for (const f of contactFields) {
    const ok = isFilled(f.value(contact));
    console.log(`  ${ok ? 'OK     ' : f.required ? 'MISSING' : 'empty  '}  ${f.label}${f.required ? '' : ' (optional)'}`);
  }
  console.log(`\n${missingRequired.length} required and ${missing.length - missingRequired.length} optional value(s) missing.`);
}

// Licence and permit details (sites/<site>/compliance.ts): listed, never invented; missing ones are simply not shown.
const { compliance } = await import(`../sites/${site}/compliance.ts`);
const licence: [string, unknown][] = [
  ['RERA ORN', compliance.company.reraOrn],
  ['DLD broker number', compliance.company.dldBrokerNumber],
  ['Trade licence number', compliance.company.tradeLicence],
  ['Trade licence issuer', compliance.company.tradeLicenceIssuer],
  ['Office address', compliance.company.officeAddress],
];
const licenceMissing = licence.filter(([, v]) => !isFilled(v));
const permits = Object.keys(compliance.projectPermits).length;
if (building) {
  // One calm line in the build log: these details are optional and nothing is shown for a missing one.
  console.log(`  Contact details: ${missingRequired.length ? `${missingRequired.length} required value(s) missing` : 'complete'}. Licence details: ${licence.length - licenceMissing.length} of ${licence.length} filled in (optional; a missing one is simply not shown). Run "npm run check:placeholders" for the list.`);
} else {
  console.log(`\nLicence and permit details (sites/${site}/compliance.ts). Optional: a missing one is simply not shown.`);
  for (const [label, v] of licence) console.log(`  ${isFilled(v) ? 'OK       ' : 'not yet  '}  ${label}`);
  console.log(`  ${permits ? 'OK       ' : 'not yet  '}  Project advertising permits: ${permits}${compliance.publishOnlyWithPermit ? ' (only these projects are published)' : ''}`);
}

if (building && live) {
  const errors: string[] = [];
  if (missingRequired.length) errors.push(`Required contact details are missing: ${missingRequired.map((f) => f.label).join(', ')}.`);
  if (process.env.PREVIEW_PLACEHOLDERS === 'true') errors.push('PREVIEW_PLACEHOLDERS is "true": placeholders must never appear on the live site.');
  if (errors.length) {
    console.error(`\nLIVE BUILD STOPPED\n- ${errors.join('\n- ')}\nFill them in sites/${site}/contact.ts, then build again.`);
    process.exit(1);
  }
} else if (building && missingRequired.length) {
  console.log('Preview build: continuing. The live build will stop until these are filled.');
}

// --report: write reports/placeholders.md (contact values + every review flag in the copy)
if (process.argv.includes('--report')) {
  const flags: { file: string; line: number; flag: string; text: string }[] = [];
  const scan = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const full = path.join(dir, f);
      if (statSync(full).isDirectory()) scan(full);
      else if (/\.(ts|tsx)$/.test(f)) {
        const lines = readFileSync(full, 'utf8').split('\n');
        lines.forEach((l, i) => {
          const m = l.match(/(SOURCE REQUIRED|VERIFY CURRENT RULES|LEGAL REVIEW REQUIRED)/);
          if (!m || full.includes('check-placeholders') || /^\s*(\/\*\*|\*|\/\/)/.test(l)) return;
          let text = '';
          for (let k = i; k >= Math.max(0, i - 8) && !text; k--) text = lines[k]!.match(/(?:title|q|h1): '([^']{0,90})/)?.[1] ?? '';
          if (!text && /LegalPage/.test(full)) text = 'Privacy, Terms, Disclaimer and Cookie policy drafts';
          flags.push({ file: path.relative(process.cwd(), full), line: i + 1, flag: m[1]!, text: text || lines[i]!.trim().slice(0, 90) });
        });
      }
    }
  };
  scan('sites');
  scan('src');
  const md = [
    '# Placeholder report',
    '',
    `Generated ${new Date().toISOString().slice(0, 10)}. Contact values live in sites/${site}/contact.ts. Review flags show as [FLAG] tags on preview builds only (PREVIEW_PLACEHOLDERS=true).`,
    '',
    '## Contact and legal details',
    '| Value | Required for launch | Status |',
    '|---|---|---|',
    ...contactFields.map((f) => `| ${f.label} | ${f.required ? 'Yes' : 'No'} | ${isFilled(f.value(contact)) ? 'Filled' : f.required ? '**Missing**' : 'Empty (section hidden)'} |`),
    '',
    `## Review flags in the copy (${flags.length})`,
    '| Flag | Where | Text |',
    '|---|---|---|',
    ...flags.map((x) => `| ${x.flag} | ${x.file}:${x.line} | ${x.text.replace(/\|/g, '/')} |`),
    '',
  ].join('\n');
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/placeholders.md', md);
  console.log(`Wrote reports/placeholders.md (${flags.length} review flags).`);
}
