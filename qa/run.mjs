// QA runner: executes the `probe` of every case in the given JSON files against the running site and writes the
// result back (actual, status, evidence). Nothing is marked pass unless the probe really ran and every check held.
// Usage: node qa/run.mjs <round> <cases.json>...   [--only=ID,ID] [--retest]
// Needs: the site on BASE (default http://localhost:3450) and Playwright (PW_PATH, default scratchpad qatools).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

const BASE = process.env.BASE || 'http://localhost:3450';
const PW = process.env.PW_PATH || '/private/tmp/claude-501/-Users-simarpreetmac-StudioProjects-MBR-PROPERTIES-WORKSPACE/8beb05c6-b8e4-4fd2-9ed9-c81ae66f2306/scratchpad/qatools/node_modules/playwright';
const { chromium } = createRequire(import.meta.url)(PW);

const args = process.argv.slice(2);
const round = args[0];
const files = args.slice(1).filter((a) => !a.startsWith('--'));
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const retest = args.includes('--retest');
const ROOT = process.cwd();
const shotDir = `qa/screenshots/r${round}`;
const evDir = `qa/evidence/r${round}`;
mkdirSync(shotDir, { recursive: true });
mkdirSync(evDir, { recursive: true });

const VIEW = { mobile: { width: 375, height: 812 }, small: { width: 320, height: 640 }, desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 } };
const projects = JSON.parse(readFileSync('data/remapp-projects.json', 'utf8')).projects;
const list = JSON.parse(readFileSync('data/remapp-projects-list.json', 'utf8'));
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const cmp = (op, got, want) => {
  const g = typeof got === 'string' ? got.trim() : got;
  switch (op || 'eq') {
    case 'eq': return String(g) === String(want);
    case 'gte': return Number.parseFloat(g) >= Number(want);
    case 'lte': return Number.parseFloat(g) <= Number(want);
    case 'contains': return String(g).toLowerCase().includes(String(want).toLowerCase());
    case 'regex': return new RegExp(want, 'i').test(String(g));
    default: return false;
  }
};

let cache = {};
async function fetchText(p, opts = {}) {
  const url = p.startsWith('http') ? p : BASE + p;
  const res = await fetch(url, { redirect: 'manual', ...opts });
  const buf = Buffer.from(await res.arrayBuffer());
  return { res, status: res.status, headers: Object.fromEntries(res.headers.entries()), text: buf.toString('utf8'), bytes: buf.length };
}

async function runHttp(pr, c) {
  const paths = pr.paths || [pr.path];
  const fails = [];
  const log = [];
  for (const p of paths) {
    const opts = { method: pr.method || 'GET' };
    if (pr.bodyJson !== undefined) { opts.body = typeof pr.bodyJson === 'string' ? pr.bodyJson : JSON.stringify(pr.bodyJson); opts.headers = { 'content-type': 'application/json', ...(pr.requestHeaders || {}) }; }
    else if (pr.requestHeaders) opts.headers = pr.requestHeaders;
    let r;
    try { r = await fetchText(p, opts); } catch (e) { fails.push(`${p}: request failed (${e.message})`); continue; }
    log.push(`${opts.method} ${p} -> ${r.status} (${r.bytes} bytes) ${r.headers['content-type'] || ''}`);
    const want = pr.expectStatus ?? 200;
    const okStatus = Array.isArray(want) ? want.includes(r.status) : r.status === want;
    if (!okStatus) fails.push(`${p}: status ${r.status}, wanted ${want}`);
    if (pr.redirectTo && !(r.headers.location || '').includes(pr.redirectTo)) fails.push(`${p}: redirect to "${r.headers.location}", wanted ${pr.redirectTo}`);
    for (const s of pr.bodyIncludes || []) if (!r.text.includes(s)) fails.push(`${p}: body lacks "${s}"`);
    for (const s of pr.bodyExcludes || []) if (r.text.includes(s)) fails.push(`${p}: body contains "${s}"`);
    if (pr.bodyRegex && !new RegExp(pr.bodyRegex, 'i').test(r.text)) fails.push(`${p}: body does not match /${pr.bodyRegex}/`);
    if (pr.bodyNotRegex && new RegExp(pr.bodyNotRegex, 'i').test(r.text)) fails.push(`${p}: body matches /${pr.bodyNotRegex}/`);
    for (const [h, re] of Object.entries(pr.headers || {})) {
      const v = r.headers[h.toLowerCase()];
      if (re === null || re === '__absent__') { if (v !== undefined) fails.push(`${p}: header ${h} present ("${v}")`); }
      else if (v === undefined || !new RegExp(re, 'i').test(v)) fails.push(`${p}: header ${h} is "${v}", wanted /${re}/`);
    }
    if (pr.jsonPath) {
      try { const body = JSON.parse(r.text); if (!Function('body', `return (${pr.jsonPath.expr})`)(body)) fails.push(`${p}: json check false: ${pr.jsonPath.expr}`); } catch (e) { fails.push(`${p}: json check error ${e.message}`); }
    }
    if (paths.length === 1) cache.lastBody = r.text.slice(0, 1500);
  }
  return { fails, log: log.join('\n') + (cache.lastBody ? `\n---\n${cache.lastBody}` : '') };
}

async function runData(pr) {
  let index = [];
  let sitemap = [];
  if (/index/.test(pr.expr)) index = JSON.parse((await fetchText('/projects-index.json')).text);
  if (/sitemap/.test(pr.expr)) sitemap = [...(await fetchText('/sitemap.xml')).text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const v = Function('projects', 'list', 'index', 'sitemap', `return (${pr.expr})`)(projects, list, index, sitemap);
  return { fails: v ? [] : [`data check false: ${pr.expr}`], log: `expr: ${pr.expr}\nresult: ${JSON.stringify(v)}\nprojects=${projects.length} index=${index.length} sitemap=${sitemap.length}` };
}

async function runUi(browser, pr, c) {
  const vp = VIEW[pr.viewport || 'desktop'];
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, ...(vp.width < 700 ? { isMobile: true, hasTouch: true } : {}), reducedMotion: pr.reducedMotion ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const external = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', (rq) => { const u = rq.url(); if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  const fails = [];
  const log = [];
  try {
    await page.goto(BASE + (pr.path || '/'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(700);
    for (const s of pr.steps || []) {
      const loc = s.sel ? page.locator(s.sel).first() : null;
      try {
        switch (s.do) {
          case 'click': await loc.click({ timeout: 5000 }); break;
          case 'hover': await loc.hover({ timeout: 5000 }); break;
          case 'dblclick': await loc.dblclick({ timeout: 5000 }); break;
          case 'fill': await loc.fill(String(s.value ?? ''), { timeout: 5000 }); break;
          case 'press': if (loc) await loc.press(s.value, { timeout: 5000 }); else await page.keyboard.press(s.value); break;
          case 'goto': await page.goto(BASE + s.value, { waitUntil: 'load' }); break;
          case 'reload': await page.reload({ waitUntil: 'load' }); break;
          case 'back': await page.goBack({ waitUntil: 'load' }); break;
          case 'wait': await page.waitForTimeout(Number(s.value || 500)); break;
          case 'scroll': await page.evaluate((y) => window.scrollTo(0, Number(y)), s.value ?? 800); break;
          default: fails.push(`unknown step ${s.do}`);
        }
        log.push(`step ${s.do} ${s.sel || ''} ${s.value ?? ''}: ok`);
      } catch (e) { fails.push(`step ${s.do} ${s.sel || ''}: ${e.message.split('\n')[0]}`); }
      await page.waitForTimeout(250);
    }
    for (const e of pr.expect || []) {
      const t = e.type;
      try {
        if (t === 'noOverflow') {
          const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
          log.push(`overflow: scrollWidth ${o.sw} vs clientWidth ${o.cw}`);
          if (o.sw > o.cw + 1) fails.push(`horizontal overflow: ${o.sw} > ${o.cw}`);
        } else if (t === 'noConsoleErrors') {
          log.push(`console errors: ${consoleErrors.length}`);
          if (consoleErrors.length) fails.push(`console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
        } else if (t === 'noExternalRequests') {
          log.push(`external requests: ${external.length}`);
          if (external.length) fails.push(`external requests: ${external.slice(0, 3).join(', ')}`);
        } else if (t === 'url') {
          const u = page.url().replace(BASE, '');
          log.push(`url: ${u}`);
          if (!cmp(e.op || 'contains', u, e.value)) fails.push(`url "${u}" vs ${e.value}`);
        } else {
          const loc = page.locator(e.sel);
          const n = await loc.count();
          if (t === 'count') { log.push(`count ${e.sel}: ${n}`); if (!cmp(e.op || 'eq', n, e.value)) fails.push(`count of ${e.sel} is ${n}, wanted ${e.op || 'eq'} ${e.value}`); }
          else if (n === 0 && t !== 'hidden') fails.push(`selector matched nothing: ${e.sel}`);
          else if (t === 'visible') { const v = await loc.first().isVisible(); log.push(`visible ${e.sel}: ${v}`); if (!v) fails.push(`${e.sel} not visible`); }
          else if (t === 'hidden') { const v = n === 0 ? false : await loc.first().isVisible(); log.push(`hidden ${e.sel}: ${!v}`); if (v) fails.push(`${e.sel} is visible`); }
          else if (t === 'text') { const tx = (await loc.first().innerText()).replace(/\s+/g, ' '); log.push(`text ${e.sel}: ${tx.slice(0, 120)}`); if (!cmp(e.op || 'contains', tx, e.value)) fails.push(`text of ${e.sel} is "${tx.slice(0, 80)}", wanted ${e.op || 'contains'} "${e.value}"`); }
          else if (t === 'textNot') { const tx = (await loc.first().innerText()).replace(/\s+/g, ' '); if (cmp('contains', tx, e.value)) fails.push(`text of ${e.sel} contains "${e.value}"`); }
          else if (t === 'attr') { const v = await loc.first().getAttribute(e.prop); log.push(`attr ${e.sel}[${e.prop}]: ${v}`); if (!cmp(e.op || 'eq', v ?? '', e.value)) fails.push(`${e.sel}[${e.prop}] is "${v}", wanted ${e.op || 'eq'} ${e.value}`); }
          else if (t === 'style') { const v = await loc.first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), e.prop); log.push(`style ${e.sel} ${e.prop}: ${v}`); if (!cmp(e.op || 'contains', v, e.value)) fails.push(`${e.sel} ${e.prop} is "${v}", wanted ${e.op || 'contains'} ${e.value}`); }
          else if (t === 'focusable') { const ok = await loc.first().evaluate((el) => { el.focus(); return document.activeElement === el; }); if (!ok) fails.push(`${e.sel} cannot take focus`); }
          else fails.push(`unknown expect type ${t}`);
        }
      } catch (er) { fails.push(`expect ${t} ${e.sel || ''}: ${er.message.split('\n')[0]}`); }
    }
    const shot = path.join(shotDir, `${c.id}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    return { fails, log: log.join('\n'), shot };
  } catch (e) {
    return { fails: [...fails, `page error: ${e.message.split('\n')[0]}`], log: log.join('\n'), shot: null };
  } finally { await ctx.close(); }
}

function runCmd(pr) {
  let out = '', code = 0;
  try { out = execSync(pr.run, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 }); } catch (e) { code = e.status ?? 1; out = (e.stdout || '') + (e.stderr || ''); }
  const fails = [];
  if (code !== (pr.expectExit ?? 0)) fails.push(`exit ${code}, wanted ${pr.expectExit ?? 0}`);
  for (const s of pr.outIncludes || []) if (!out.includes(s)) fails.push(`output lacks "${s}"`);
  return { fails, log: out.slice(-1500) };
}

function runFile(pr) {
  const fails = [];
  const p = path.join(ROOT, pr.path);
  const exists = existsSync(p);
  if (pr.exists !== undefined && exists !== pr.exists) fails.push(`${pr.path} exists=${exists}, wanted ${pr.exists}`);
  let text = '';
  if (exists) { try { text = readFileSync(p, 'utf8'); } catch {} }
  for (const s of pr.includes || []) if (!text.includes(s)) fails.push(`${pr.path} lacks "${s}"`);
  for (const s of pr.excludes || []) if (text.includes(s)) fails.push(`${pr.path} contains "${s}"`);
  if (pr.regex && !new RegExp(pr.regex, 'i').test(text)) fails.push(`${pr.path} does not match /${pr.regex}/`);
  return { fails, log: `${pr.path} exists=${exists} size=${text.length}` };
}

const browser = await chromium.launch();
const summary = { pass: 0, fail: 0, blocked: 0 };
for (const f of files) {
  const cases = JSON.parse(readFileSync(f, 'utf8'));
  for (const c of cases) {
    if (only.length && !only.includes(c.id)) continue;
    if (retest && c.status !== 'fail') continue;
    if (!retest && c.bug && c.status === 'fail') continue; // a recorded bug waits for its retest
    cache = {};
    const pr = c.probe;
    let r;
    try {
      if (!pr || !pr.kind) r = { blocked: 'no probe' };
      else if (pr.kind === 'http') r = await runHttp(pr, c);
      else if (pr.kind === 'ui') r = await runUi(browser, pr, c);
      else if (pr.kind === 'data') r = await runData(pr);
      else if (pr.kind === 'contrast') { const v = ratio(pr.fg, pr.bg); const ok = pr.max !== undefined ? v < pr.max : v >= pr.min; r = { fails: ok ? [] : [`contrast ${v.toFixed(2)}:1 ${pr.max !== undefined ? 'not below ' + pr.max : 'below ' + pr.min}`], log: `${pr.fg} on ${pr.bg} = ${v.toFixed(2)}:1` }; }
      else if (pr.kind === 'file') r = runFile(pr);
      else if (pr.kind === 'cmd') r = runCmd(pr);
      else r = { blocked: `unknown probe kind ${pr.kind}` };
    } catch (e) { r = { fails: [`runner error: ${e.message.split('\n')[0]}`], log: '' }; }
    if (r.blocked) { c.status = 'blocked'; c.actual = r.blocked; summary.blocked++; continue; }
    const evFile = path.join(evDir, `${c.id}.txt`);
    writeFileSync(evFile, `${c.id}: ${c.title}\nprobe: ${JSON.stringify(pr)}\n\nresult: ${r.fails.length ? 'FAIL' : 'PASS'}\n${r.fails.map((x) => '- ' + x).join('\n')}\n\n${r.log || ''}\n`);
    const ev = [evFile.replace(/^qa\//, '../')];
    if (r.shot) ev.unshift(r.shot.replace(/^qa\//, '../'));
    const rtKey = retest ? 'retest' : 'status';
    if (retest) c.retest = r.fails.length ? 'fail' : 'pass'; else c.status = r.fails.length ? 'fail' : 'pass';
    c.actual = r.fails.length ? r.fails.join('; ').slice(0, 600) : (r.log || '').split('\n')[0].slice(0, 300) || 'as expected';
    c.evidence = ev;
    if (r.fails.length && !retest && !c.severity) c.severity = 'medium';
    summary[r.fails.length ? 'fail' : 'pass']++;
    process.stdout.write(`${r.fails.length ? 'FAIL' : 'ok  '} ${c.id} ${c.title.slice(0, 70)}${r.fails.length ? '\n       ' + r.fails[0].slice(0, 160) : ''}\n`);
  }
  writeFileSync(f, JSON.stringify(cases, null, 2));
}
await browser.close();
console.log(JSON.stringify(summary));
