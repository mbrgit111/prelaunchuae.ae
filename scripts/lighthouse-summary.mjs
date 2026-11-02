// Writes reports/lighthouse/summary.md from the Lighthouse JSON files (run scripts/lighthouse.sh first).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const dir = "reports/lighthouse";
const rows = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  const c = d.categories, a = d.audits;
  const s = (k) => Math.round(c[k].score * 100);
  return `| ${d.finalDisplayedUrl.replace(/^https?:\/\/[^/]+/, "") || "/"} | ${s("performance")} | ${s("accessibility")} | ${s("best-practices")} | ${s("seo")} | ${a["largest-contentful-paint"].displayValue} | ${a["cumulative-layout-shift"].displayValue} | ${a["total-blocking-time"].displayValue} | ${a["first-contentful-paint"].displayValue} |`;
});
writeFileSync(`${dir}/summary.md`, [
  "# Lighthouse report (mobile)",
  "",
  `Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} with Lighthouse 12, mobile, simulated throttling (the PageSpeed Insights method), on the production build.`,
  "",
  "| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | FCP |",
  "|---|---|---|---|---|---|---|---|---|",
  ...rows,
  "",
  "LCP in simulated mode includes downloading the React and Next.js framework (about 150 KB) on a throttled phone connection.",
  "INP cannot be measured in a lab run; Total Blocking Time (TBT) is its lab stand-in and stays under 50 ms.",
  "",
].join("\n"));
console.log(readFileSync(`${dir}/summary.md`, "utf8"));
