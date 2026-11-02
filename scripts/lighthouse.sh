#!/bin/sh
# Mobile Lighthouse (simulated throttling, like PageSpeed Insights) on the key pages. Needs the site running: npm run build && npm start
# Usage: sh scripts/lighthouse.sh [base-url]   -> reports/lighthouse/*.json + reports/lighthouse/summary.md
#   BLOG_SLUG=... NEWS_SLUG=...  choose the blog post and news post to measure (defaults: the first ones listed in the sitemap)
BASE="${1:-http://localhost:3000}"
mkdir -p reports/lighthouse
first_of() { curl -s "$BASE/sitemap.xml" | grep -o "<loc>[^<]*/$1/[^</]*</loc>" | grep -v "/page/" | head -1 | sed "s#<loc>.*/$1/##; s#</loc>##"; }
BLOG_SLUG="${BLOG_SLUG:-$(first_of blog)}"
NEWS_SLUG="${NEWS_SLUG:-$(first_of news)}"
PAGES="/ /projects/aeon /projects /areas/dubai-islands /blog"
[ -n "$BLOG_SLUG" ] && PAGES="$PAGES /blog/$BLOG_SLUG" || echo "No blog post found in the sitemap: skipping the blog post page."
[ -n "$NEWS_SLUG" ] && PAGES="$PAGES /news/$NEWS_SLUG" || echo "No news post found in the sitemap: skipping the news post page."
echo "# Lighthouse (mobile)" > reports/lighthouse/summary.md
echo "" >> reports/lighthouse/summary.md
echo "| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |" >> reports/lighthouse/summary.md
echo "|---|---|---|---|---|---|---|" >> reports/lighthouse/summary.md
for u in $PAGES; do
  n=$(echo "$u" | sed 's#^/$#home#; s#^/##; s#/#-#g')
  for run in 1 2; do # first run warms the image cache, the second is recorded
    npx -y lighthouse@12 "$BASE$u" --quiet --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="reports/lighthouse/$n.json" --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1
  done
  node -e '
    const r=require("./reports/lighthouse/'"$n"'.json"); const c=r.categories, a=r.audits;
    const s=k=>Math.round((c[k]?.score??0)*100);
    console.log(`| '"$u"' | ${s("performance")} | ${s("accessibility")} | ${s("best-practices")} | ${s("seo")} | ${a["largest-contentful-paint"]?.displayValue??"-"} | ${a["cumulative-layout-shift"]?.displayValue??"-"} |`);
  ' >> reports/lighthouse/summary.md 2>/dev/null || echo "| $u | (no result) |||||" >> reports/lighthouse/summary.md
done
cat reports/lighthouse/summary.md
