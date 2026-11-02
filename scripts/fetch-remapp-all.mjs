// Every project in the REM off-plan portal (all districts, nothing filtered out) into ONE JSON file.
//
//   REMAPP_TOKEN=<auth_token from off-plan.remapp.ae localStorage> node scripts/fetch-remapp-all.mjs
//   REMAPP_TOKEN=… node scripts/fetch-remapp-all.mjs --probe        (list only: shows the count and what it contains, saves nothing)
//   node scripts/fetch-remapp-all.mjs --expect 2359                 (warn if the list does not have that many)
//
// - The token is read from the environment only. It is never written to any file, log or output.
// - Output: exports/remapp-all-projects.json  (folder exports/ is git-ignored and never deployed; the file is large).
// - Resumable: progress is saved line by line in exports/remapp-all.progress.ndjson. Run the same command again after a
//   stop (expired token, lost connection) and it carries on where it stopped.
// - Gentle on the portal: one request at a time, a short pause between requests, slows down if the portal asks to.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

const token = process.env.REMAPP_TOKEN;
if (!token) {
  console.error('Set REMAPP_TOKEN first (the auth_token value from off-plan.remapp.ae → Application → Local Storage).');
  process.exit(1);
}
const BASE = process.env.REMAPP_BASE ?? 'https://off-plan.remapp.ae/api/v1';
const PAUSE_MS = Number(process.env.REMAPP_PAUSE_MS ?? 150);
const expect = value('expect') ? Number(value('expect')) : null;
const OUT_DIR = 'exports';
const OUT = `${OUT_DIR}/remapp-all-projects.json`;
const LIST = `${OUT_DIR}/remapp-all-list.json`;
const PROGRESS = `${OUT_DIR}/remapp-all.progress.ndjson`;

const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pause = PAUSE_MS;

class AuthError extends Error {}
async function getJson(url, tries = 5) {
  for (let i = 1; i <= tries; i++) {
    let res;
    try { res = await fetch(url, { headers }); } catch (e) { if (i === tries) throw e; await sleep(1000 * i); continue; }
    if (res.ok) return res.json();
    if (res.status === 401 || res.status === 403) throw new AuthError(`${res.status}: the token expired or was refused. Copy a fresh auth_token and run the same command again (progress is kept).`);
    if (res.status === 429) { pause = Math.min(pause * 2, 5000); await sleep(Number(res.headers.get('retry-after') ?? 0) * 1000 || 2000 * i); continue; }
    if (i === tries) throw new Error(`${res.status} for ${url.replace(/\?.*$/, '')}`);
    await sleep(500 * i);
  }
}

// The list: the same call the portal's map uses, with no district filter.
const listOf = (r) => (Array.isArray(r) ? r : r?.data ?? r?.projects ?? r?.items ?? r?.results ?? []);
let raw;
try { raw = await getJson(`${BASE}/projects/map`); } catch (e) { console.error(e instanceof AuthError ? e.message : `Could not read the project list: ${e.message}`); process.exit(2); }
const list = listOf(raw);
const byDistrict = {};
for (const p of list) byDistrict[p.districtName ?? p.district?.name ?? '(none)'] = (byDistrict[p.districtName ?? p.district?.name ?? '(none)'] ?? 0) + 1;
console.log(`The portal lists ${list.length} projects${Object.keys(byDistrict).length ? ` in ${Object.keys(byDistrict).length} districts` : ''}.`);
if (list.length && flag('probe')) {
  console.log('Fields in a list entry:', Object.keys(list[0]).join(', '));
  console.log('Largest districts:', Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(' | '));
}
if (expect && list.length !== expect) console.warn(`WARNING: expected ${expect} projects but the list has ${list.length}.${list.length < expect ? ' The unfiltered list may be capped or paged; tell Claude the numbers above.' : ''}`);
if (!list.length) { console.error('The list came back empty. Response shape:', typeof raw, Array.isArray(raw) ? 'array' : Object.keys(raw ?? {}).join(', ')); process.exit(1); }
if (flag('probe')) process.exit(0);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(LIST, JSON.stringify(list));

// Details: one call per project, saved as they arrive.
const done = new Map();
if (existsSync(PROGRESS)) {
  for (const line of readFileSync(PROGRESS, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const row = JSON.parse(line); done.set(row.id, row.detail); } catch { /* a half-written last line: fetched again */ }
  }
  console.log(`Resuming: ${done.size} already saved.`);
}
const failed = [];
let n = 0;
try {
  for (const p of list) {
    n++;
    if (done.has(p.id)) continue;
    try {
      const r = await getJson(`${BASE}/projects/${p.id}`);
      const detail = r.data ?? r;
      done.set(p.id, detail);
      appendFileSync(PROGRESS, `${JSON.stringify({ id: p.id, detail })}\n`);
    } catch (e) {
      if (e instanceof AuthError) throw e;
      failed.push({ id: p.id, title: p.title, error: e.message });
      console.error(`FAILED ${p.title}: ${e.message}`);
    }
    if (n % 50 === 0 || n === list.length) console.log(`${n}/${list.length}  (${done.size} saved, ${failed.length} failed)`);
    await sleep(pause);
  }
} catch (e) {
  console.error(`\nStopped at ${n}/${list.length}: ${e.message}\n${done.size} projects are saved; run the same command again to continue.`);
  process.exit(2);
}

// Final file: same order as the list, so it is easy to compare with the portal.
const projects = list.filter((p) => done.has(p.id)).map((p) => done.get(p.id));
const tmp = `${OUT}.tmp`;
writeFileSync(tmp, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'off-plan.remapp.ae', scope: 'all projects, all districts, unfiltered', listCount: list.length, count: projects.length, failed, projects }, null, 1));
renameSync(tmp, OUT);
console.log(`\nSaved ${projects.length} of ${list.length} projects to ${OUT}${failed.length ? `; ${failed.length} failed (listed inside the file; run again to retry them)` : ''}.`);
if (failed.length) process.exit(3);
