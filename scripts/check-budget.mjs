// Performance budget (runs after every build). Measures what each page ships, writes reports/bundle-size.md,
// and FAILS the build if any page goes over budget. Sizes are gzip, which is what travels over the network.
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// Set just above the sizes measured on 5 Oct 2026 (largest page: total JS 187 KB, site JS 14 KB, HTML 88 KB, CSS 10 KB).
// React + Next.js alone are ~173 KB of that. The HTML budget leaves room for the project list to grow.
const BUDGET = {
  jsTotal: 195 * 1024, // all JavaScript a page loads (framework + site code)
  jsPage: 20 * 1024, // site-specific JavaScript beyond the shared framework chunks (forms, animation, filters, gallery)
  html: 150 * 1024, // the HTML document (includes Next.js page data)
  css: 15 * 1024, // inlined CSS
};
const ROOT = process.cwd();
const APP = path.join(ROOT, ".next/server/app");
const gz = (buf) => gzipSync(buf).length;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

// Prerendered pages are .html locally; some hosts' builds (Vercel) may store them as .body files instead.
const isPage = (f, full) => !f.startsWith("_") && (f.endsWith(".html") || (f.endsWith(".body") && /^\s*<!DOCTYPE html/i.test(readFileSync(full, "utf8").slice(0, 200))));
function htmlFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const full = path.join(dir, f);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (isPage(f, full)) out.push(full);
  }
  return out;
}

const pages = htmlFiles(APP).map((file) => {
  const html = readFileSync(file, "utf8");
  const route = "/" + path.relative(APP, file).replace(/\.(html|body)$/, "").replace(/(^|\/)index$/, "");
  const scripts = [...new Set([...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]))];
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("");
  return { route: route === "/" ? "/" : route.replace(/\/$/, ""), html, scripts, css };
});
if (!pages.length) {
  if (process.env.VERCEL) {
    // The build itself succeeded; this host keeps the finished pages elsewhere. Never block a deploy over the report:
    // the budget is still enforced on every local build (npm run build).
    console.warn("Budget check skipped: no prerendered pages found in .next/server/app on this host.");
    process.exit(0);
  }
  console.error("No built pages found. Run next build first.");
  process.exit(1);
}

const chunkSize = new Map();
for (const p of pages) for (const s of p.scripts) if (!chunkSize.has(s)) {
  const f = path.join(ROOT, ".next", s.replace("/_next/", ""));
  chunkSize.set(s, existsSync(f) ? gz(readFileSync(f)) : 0);
}
const shared = [...chunkSize.keys()].filter((s) => pages.every((p) => p.scripts.includes(s)));
const rows = pages.map((p) => ({
  route: p.route,
  jsTotal: p.scripts.reduce((n, s) => n + chunkSize.get(s), 0),
  jsPage: p.scripts.filter((s) => !shared.includes(s)).reduce((n, s) => n + chunkSize.get(s), 0),
  html: gz(Buffer.from(p.html)),
  css: gz(Buffer.from(p.css)),
}));

const over = [];
for (const r of rows) for (const k of Object.keys(BUDGET)) if (r[k] > BUDGET[k]) over.push(`${r.route}: ${k} ${kb(r[k])} > budget ${kb(BUDGET[k])}`);

const groups = new Map();
for (const r of rows) {
  const key = r.route.replace(/^\/(projects|developers|blog|news|category|author|apartments)\/.+/, "/$1/[slug]");
  const g = groups.get(key) ?? { key, n: 0, jsTotal: 0, jsPage: 0, html: 0, css: 0 };
  g.n++;
  for (const k of ["jsTotal", "jsPage", "html", "css"]) g[k] = Math.max(g[k], r[k]);
  groups.set(key, g);
}
const sharedKb = shared.reduce((n, s) => n + chunkSize.get(s), 0);
const md = [
  "# Bundle size report",
  "",
  `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} from the production build. Sizes are gzip. Largest page per route type shown.`,
  "",
  `Budgets: total JS ${kb(BUDGET.jsTotal)}, site-specific JS ${kb(BUDGET.jsPage)}, HTML ${kb(BUDGET.html)}, inline CSS ${kb(BUDGET.css)}.`,
  `Shared framework chunks (React + Next.js, on every page): ${shared.length} files, ${kb(sharedKb)}.`,
  "",
  "| Route | Pages | Total JS | Site JS | HTML | CSS |",
  "|---|---|---|---|---|---|",
  ...[...groups.values()].sort((a, b) => b.jsTotal - a.jsTotal).map((g) => `| ${g.key} | ${g.n} | ${kb(g.jsTotal)} | ${kb(g.jsPage)} | ${kb(g.html)} | ${kb(g.css)} |`),
  "",
  over.length ? `## Over budget\n${over.map((o) => `- ${o}`).join("\n")}` : "All pages are within budget.",
  "",
].join("\n");
mkdirSync(path.join(ROOT, "reports"), { recursive: true });
writeFileSync(path.join(ROOT, "reports/bundle-size.md"), md);
console.log(`Budget check: ${rows.length} pages, shared framework JS ${kb(sharedKb)}. ${over.length ? `${over.length} over budget.` : "All within budget."} (reports/bundle-size.md)`);
if (over.length) {
  console.error(over.join("\n"));
  process.exit(1);
}
