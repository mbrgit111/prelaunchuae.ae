// Saves a copy of the published blog and news to content-snapshot.json before the build.
// The site uses the copy only when the content API cannot be reached, so a backend outage never stops a build.
// This script never fails the build: if the API is not reachable it keeps the snapshot that is already there.
// Run it against the real API address (CONTENT_API_URL + CONTENT_SITE_KEY) and commit the file to keep the fallback fresh.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "content-snapshot.json";
const url = (process.env.CONTENT_API_URL || process.env.LEAD_API_URL || "https://mbrbackend.wellnessz.in").replace(/\/$/, "");
const key = process.env.CONTENT_SITE_KEY || process.env.LEAD_SITE_KEY || "pk_placeholder_netcapital";
const contentKey = process.env.CONTENT_SITE_ID || "prelaunchuae";
const say = (m) => console.log(`[content-snapshot] ${m}`);

if (!url || !key) {
  say("API address or site key not set: keeping the snapshot as it is.");
  process.exit(0);
}
// A snapshot of someone's laptop data must never be saved as the fallback.
if (/localhost|127\.0\.0\.1/.test(url) && !process.argv.includes("--force")) {
  say("API is on localhost: not saving a snapshot (use --force to override).");
  process.exit(0);
}

const get = async (path) => {
  const res = await fetch(`${url}/v1/public${path}`, { headers: { "X-Site-Key": key }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${path} answered ${res.status}`);
  return res.json();
};

try {
  const cards = [];
  let cursor = "";
  for (let i = 0; i < 20; i += 1) {
    const page = await get(`/posts?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    cards.push(...page.items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  const posts = {};
  for (const card of cards) posts[card.slug] = await get(`/posts/${encodeURIComponent(card.slug)}`);
  const authors = {};
  for (const slug of new Set(cards.map((c) => c.author?.slug).filter(Boolean))) authors[slug] = await get(`/authors/${encodeURIComponent(slug)}`);
  const [categories, redirects, sitemap] = await Promise.all([get("/categories"), get("/redirects"), get("/sitemap-posts")]);
  const snapshot = { generatedAt: new Date().toISOString(), apiUrl: new URL(url).origin, contentKey, cards, posts, categories: categories.items, authors, redirects: redirects.items, sitemap: sitemap.items };
  writeFileSync(FILE, `${JSON.stringify(snapshot, null, 1)}\n`);
  say(cards.length
    ? `saved ${cards.length} article(s), ${categories.items.length} categories, ${redirects.items.length} redirects.`
    : "connected to the MBR desk. No articles are published for this site yet, so the blog stays hidden (this is normal).");
} catch (error) {
  let had = "no snapshot";
  try {
    const old = JSON.parse(readFileSync(FILE, "utf8"));
    had = old.generatedAt ? `the snapshot from ${old.generatedAt}` : "an empty snapshot";
  } catch {}
  say(`API not reachable (${error instanceof Error ? error.message : "error"}). Keeping ${had}.`);
}
process.exit(0);
