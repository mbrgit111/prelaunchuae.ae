// SEO and structured-data check over the built HTML (run after a build): npm run check:seo
// Writes reports/seo-check.md. Exits with an error if a page breaks a rule.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, ".next/server/app");
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const full = path.join(d, f);
    if (statSync(full).isDirectory()) walk(full);
    else if (f.endsWith(".html") && !f.startsWith("_")) files.push(full);
  }
})(APP);

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const routeOf = (f) => {
  const r = "/" + path.relative(APP, f).replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  return r === "/" ? "/" : r.replace(/\/$/, "");
};
const routes = new Set(files.map(routeOf));
// Pages made on first visit (most projects and developers, later list pages) are not in the build output, but links to
// them are valid: they are listed in the project index the build writes.
const onDemand = new Set();
try {
  const index = JSON.parse(readFileSync(path.join(APP, "projects-index.json.body"), "utf8"));
  for (const it of index) {
    onDemand.add(`/projects/${it.s}`);
    onDemand.add(`/developers/${it.ds}`);
  }
  for (let n = 2; n <= Math.ceil(index.length / 24); n++) onDemand.add(`/projects/page/${n}`);
} catch {
  // no index (an older build): only built pages count
}
const errors = [];
const warnings = [];
const pages = [];
const schemaTypes = new Map();

for (const f of files) {
  const route = routeOf(f);
  const html = readFileSync(f, "utf8");
  const head = html.split("</head>")[0];
  const body = html.split("<body")[1] ?? "";
  const visible = body.replace(/<script[\s\S]*?<\/script>/g, "");
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(head);
  const title = decode(head.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const desc = decode(head.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const canonical = head.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  const h1 = (visible.match(/<h1[\s>]/g) ?? []).length;
  const imgs = [...visible.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((i) => !/\balt="/.test(i)).length;
  const p = { route, title, desc, canonical, h1, noindex, imgs: imgs.length };
  pages.push(p);
  const err = (m) => errors.push(`${route}: ${m}`);
  const warn = (m) => warnings.push(`${route}: ${m}`);
  if (!/<html[^>]*\blang="/.test(html)) err("missing <html lang>");
  if (!title) err("missing <title>");
  if (!desc) err("missing meta description");
  else if (desc.length < 50 || desc.length > 170) warn(`meta description is ${desc.length} characters (aim for 50 to 170)`);
  if (title.length > 70) warn(`title is ${title.length} characters (search results show about 60)`);
  if (route !== "/_not-found" && !canonical) err("missing canonical link");
  if (h1 !== 1) err(`has ${h1} <h1> elements (needs exactly one)`);
  if (!/<meta property="og:image"/.test(head)) err("missing og:image");
  if (!/<meta name="twitter:card"/.test(head)) err("missing twitter:card");
  if (noAlt) err(`${noAlt} image(s) without an alt attribute`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of Array.isArray(data) ? data : [data]) {
        if (!node["@context"] || !node["@type"]) err("JSON-LD block without @context or @type");
        const types = [node["@type"]].flat();
        for (const t of types) schemaTypes.set(t, (schemaTypes.get(t) ?? 0) + 1);
        if (types.includes("FAQPage") && !(node.mainEntity ?? []).every((q) => q.name && q.acceptedAnswer?.text)) err("FAQPage question without an answer");
        if (types.includes("BreadcrumbList") && !(node.itemListElement ?? []).every((it, i) => it.position === i + 1 && it.item)) err("BreadcrumbList item out of order or without a URL");
      }
    } catch {
      err("JSON-LD block is not valid JSON");
    }
  }
  for (const m of visible.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].replace(/\/$/, "") || "/";
    if (/\.(svg|png|ico|jpg|webp|webmanifest|xml|txt)$/.test(target) || target.startsWith("/_next") || target.startsWith("/media")) continue;
    if (!routes.has(target) && !onDemand.has(target)) err(`links to ${target}, which does not exist`);
  }
}

const dup = (key) => {
  const seen = new Map();
  for (const p of pages.filter((x) => !x.noindex && x.route !== "/_not-found")) seen.set(p[key], [...(seen.get(p[key]) ?? []), p.route]);
  return [...seen.entries()].filter(([k, v]) => k && v.length > 1);
};
for (const [t, r] of dup("title")) errors.push(`Duplicate title "${t}" on ${r.join(", ")}`);
for (const [d, r] of dup("desc")) errors.push(`Duplicate description on ${r.join(", ")}: "${d.slice(0, 60)}…"`);

const uniqErrors = [...new Set(errors)];
const indexed = pages.filter((p) => !p.noindex && p.route !== "/_not-found");
const md = [
  "# SEO and schema check",
  "",
  `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} from the production build.`,
  "",
  `- Pages checked: ${pages.length} (${indexed.length} indexable, ${pages.length - indexed.length} noindex: ${pages.filter((p) => p.noindex).map((p) => p.route).join(", ") || "none"})`,
  `- Rules: html lang, unique title and meta description, canonical, exactly one H1, Open Graph image, Twitter card, alt on every image, valid JSON-LD, no broken internal links.`,
  `- Structured data found: ${[...schemaTypes.entries()].map(([t, n]) => `${t} (${n})`).join(", ")}`,
  "",
  uniqErrors.length ? `## Errors (${uniqErrors.length})\n${uniqErrors.map((e) => `- ${e}`).join("\n")}` : "## Errors\nNone.",
  "",
  warnings.length ? `## Warnings (${warnings.length})\n${warnings.map((w) => `- ${w}`).join("\n")}` : "## Warnings\nNone.",
  "",
].join("\n");
mkdirSync(path.join(ROOT, "reports"), { recursive: true });
writeFileSync(path.join(ROOT, "reports/seo-check.md"), md);
console.log(`SEO check: ${pages.length} pages, ${uniqErrors.length} errors, ${warnings.length} warnings (reports/seo-check.md)`);
if (uniqErrors.length) {
  console.error(uniqErrors.slice(0, 40).join("\n"));
  process.exit(1);
}
