// Downloads every picture the site uses from the source portal ONCE, shrinks it, saves it under public/media/,
// and writes data/media-manifest.json (portal URL -> local file + size). Visitors never load anything from the portal.
//
// Each cover is saved twice: a large file and a small one (-sm) for cards. Everything else is saved once, sized for its
// largest use. Sold-out projects bring only their cover (src/data/slim.ts), which keeps the full portal
// (about 2,400 projects) near 13,000 files.
// src/lib/image-loader.ts picks the right one, so no image service is needed and nothing is resized per visit.
// Finished files are kept in .next/cache/nc-media (Vercel keeps that folder between builds) and copied to public/media,
// so a rebuild only downloads pictures that are new. Raw downloads are not kept (they would not fit the build cache).
// Usage: npm run sync:images   (also runs automatically before every build)
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fitLogo, LOGO_FIT } from "./fit-logo.mjs";

const ROOT = process.cwd();
const STORE = path.join(ROOT, ".next/cache/nc-media");
const OUT = path.join(ROOT, "public/media");
const MANIFEST = path.join(ROOT, "data/media-manifest.json");
// Pictures the portal answers "not found" or "access denied" for: deleted or replaced there since the export.
const UNAVAILABLE = path.join(ROOT, "data/media-unavailable.json");
const PARALLEL = Number(process.env.SYNC_PARALLEL ?? 10);
// A build must never die on pictures. After this many minutes the step stops starting new downloads: covers and logos
// go first, so what is left are gallery pictures and floor plans, which the next build (with its saved pictures) adds.
const BUDGET_MS = Number(process.env.SYNC_MINUTES ?? 18) * 60_000;

// Longest side kept per kind. "sm" is the card and thumbnail copy.
const SPEC = {
  cover: { width: 1280, quality: 72, sm: { width: 720, quality: 70 } },
  // Sold-out projects: one copy only (their pages are rarely the first stop).
  "cover-solo": { width: 960, quality: 68 },
  gallery: { width: 960, quality: 64 },
  plan: { width: 1200, quality: 80 },
  amenity: { width: 720, quality: 70 },
  place: { width: 480, quality: 70 },
  logo: { width: 480, quality: 90 },
};

const detail = JSON.parse(readFileSync(path.join(ROOT, "data/remapp-projects.json"), "utf8"));
const jobs = new Map();
const add = (url, kind) => {
  if (typeof url === "string" && /^https?:\/\//.test(url) && !jobs.has(url)) jobs.set(url, kind);
};
for (const p of detail.projects) {
  if (p.isPrivate || p.isPublic === false) continue;
  add(p.images?.featured, p.status === "sold_out" ? "cover-solo" : "cover");
  for (const group of ["exterior", "interior", "lobby", "general", "architecture", "amenities", "other"]) {
    for (const u of p.images?.[group] ?? []) add(u, "gallery");
  }
  for (const u of p.unitStructures ?? []) add(u.image, "plan");
  for (const a of p.amenities ?? []) add(a.image, "amenity");
  for (const n of p.nearbyLocations ?? []) add(n.picture, "place");
  add(p.developer?.logo, "logo");
}

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const manifest = {};
const failed = [];
const gone = [];
let reused = 0, made = 0;
mkdirSync(STORE, { recursive: true });

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.status === 403 || res.status === 404 || res.status === 410) throw Object.assign(new Error(`HTTP ${res.status}`), { gone: true });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 3 || e.gone) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

async function run([url, kind]) {
  const name = createHash("sha1").update(url).digest("hex").slice(0, 16);
  const rel = `/media/${kind}/${name}.webp`;
  const file = path.join(STORE, kind, `${name}.webp`);
  const spec = SPEC[kind];
  const smFile = spec.sm ? file.replace(/\.webp$/, "-sm.webp") : null;
  const prev = previous[url];
  if (prev && prev.src === rel && existsSync(file) && (!smFile || existsSync(smFile)) && (kind !== "logo" || prev.fit === LOGO_FIT)) {
    manifest[url] = prev;
    reused++;
    return;
  }
  // Made by an earlier run that stopped before writing the manifest: read the size back from the file.
  if (kind !== "logo" && existsSync(file) && (!smFile || existsSync(smFile))) {
    try {
      const meta = await sharp(file).metadata();
      manifest[url] = { src: rel, width: meta.width, height: meta.height, kind };
      reused++;
      return;
    } catch {
      // unreadable file: make it again below
    }
  }
  try {
    const raw = await download(url);
    mkdirSync(path.dirname(file), { recursive: true });
    if (kind === "logo") {
      const fitted = await fitLogo(raw);
      writeFileSync(file, fitted.buffer);
      manifest[url] = { src: rel, width: fitted.width, height: fitted.height, kind, fit: LOGO_FIT, ...(fitted.weak ? { weak: true } : {}) };
    } else {
      const img = sharp(raw, { failOn: "none" }).rotate();
      const info = await img.clone().resize({ width: spec.width, height: spec.width, fit: "inside", withoutEnlargement: true }).webp({ quality: spec.quality }).toFile(file);
      if (smFile) await img.clone().resize({ width: spec.sm.width, height: spec.sm.width, fit: "inside", withoutEnlargement: true }).webp({ quality: spec.sm.quality }).toFile(smFile);
      manifest[url] = { src: rel, width: info.width, height: info.height, kind };
    }
    made++;
  } catch (e) {
    (e.gone ? gone : failed).push({ url, kind, error: String(e.message ?? e) });
  }
}

// Covers and logos first, so every project has its main picture even if a long run is stopped part way.
const ORDER = { cover: 0, "cover-solo": 0, logo: 1, gallery: 2, plan: 3, place: 4, amenity: 5 };
const all = [...jobs.entries()].sort((a, b) => ORDER[a[1]] - ORDER[b[1]]);
// Written to a temporary file and renamed, so a reader never sees a half-written file.
const writeWhole = (file, text) => { writeFileSync(`${file}.tmp`, text); renameSync(`${file}.tmp`, file); };
const saveManifest = () => writeWhole(MANIFEST, JSON.stringify(Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))));
const started = Date.now();
let next = 0, done = 0;
let skipped = 0;
async function worker() {
  while (next < all.length) {
    const job = all[next++];
    if (Date.now() - started > BUDGET_MS && !existsSync(path.join(STORE, job[1], `${createHash("sha1").update(job[0]).digest("hex").slice(0, 16)}.webp`))) {
      skipped++;
      continue;
    }
    await run(job);
    if (++done % 250 === 0) saveManifest();
    if (done % 2000 === 0) {
      process.stdout.write(`  pictures checked: ${done} of ${all.length}  (${Math.round((Date.now() - started) / 1000)}s)\n`);
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));

const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
writeWhole(MANIFEST, JSON.stringify(sorted));
// public/media is rebuilt from the store every time, so pictures no longer in the data never ship.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const keep = new Set(Object.values(sorted).flatMap((m) => [m.src, m.src.replace(/\.webp$/, "-sm.webp")]));
cpSync(STORE, OUT, { recursive: true, filter: (src) => !src.endsWith(".webp") || keep.has(`/media/${path.relative(STORE, src).split(path.sep).join("/")}`) });

const byKind = (list) => list.reduce((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
console.log(`Pictures: ${all.length} needed (${JSON.stringify(byKind([...jobs.values()]))})`);
writeWhole(UNAVAILABLE, JSON.stringify(gone.map((g) => g.url).sort()));
console.log(`  ready ${Object.keys(manifest).length} | newly made ${made} | reused ${reused} | could not be downloaded ${failed.length} | ${Math.round((Date.now() - started) / 1000)}s`);
if (skipped) console.log(`  Time limit reached: ${skipped} gallery picture(s) or floor plan(s) were left for the next build, which adds them. This is not an error.`);
if (gone.length) console.log(`  ${gone.length} picture(s) no longer exist at the portal (removed or replaced since the export); they are left out. This is not an error.`);
if (failed.length) console.log("  could not be downloaded (will be tried again on the next build):", JSON.stringify(failed.slice(0, 10), null, 1));
const coversMissing = [...failed, ...gone].filter((f) => f.kind === "cover" || f.kind === "cover-solo");
// One missing cover hides that project's picture; many means the portal is unreachable, so the build stops.
if (coversMissing.length > Math.max(5, all.length * 0.01)) {
  console.error(`${coversMissing.length} project covers could not be downloaded. The portal's picture server may be down, so the build stops here.`);
  process.exit(1);
}
