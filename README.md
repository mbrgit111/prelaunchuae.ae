# PrelaunchUAE (prelaunchuae.com)

Only the pre-launch projects of the REM Off-Plan portal (status New launch and Coming soon; no sold-out and no ready-to-buy projects), across the UAE, for MBR Properties.
A copy of the Net Capital engine (same pages, forms, blog and backend connection) in the PrelaunchUAE brand (Brand Guidelines v1.0, Nov 2026):
Midnight Ink, Launch Amber, Desert Sand, Sora headlines, Manrope text. What still needs MBR: `NEEDS-FROM-MBR.md`. Going online: `DEPLOY-GUIDE.md`.

## Run it on your computer
    npm install
    npm run dev                     # http://localhost:3000 while editing
    npm run build && npm start      # the real (fast) version

`npm run build` checks the contact details, downloads and shrinks the pictures (about 680 files, under a minute), checks the data, saves a copy of the published articles, builds every page (about 290), then checks the page sizes. If anything in the data is wrong, it stops and says which project and which field.

## Where things live
| What | Where |
|---|---|
| **Contact details: phone and email (one file)** | `sites/prelaunchuae/contact.ts` |
| Licence, registration and project permits | `sites/prelaunchuae/compliance.ts` |
| Name, domain, menu, area spellings | `sites/prelaunchuae/site.config.ts` |
| Brand colours and type | `sites/prelaunchuae/theme/` |
| Words (home, pages, FAQs, legal drafts, project and area templates) | `sites/prelaunchuae/copy/` |
| Project data (made from the portal export) | `data/remapp-projects.json`, `data/remapp-projects-list.json` |
| Logos and icons | `public/brand/`, `public/` |
| The connection to the MBR backend (forms, blog, catalogue) | `src/lib/content/settings.ts`, `src/lib/forwardLead.ts` |
| Things MBR still needs to send | `NEEDS-FROM-MBR.md` |
| Putting it online | `DEPLOY-GUIDE.md` |

## Pages
Home · `/projects` (search, and filters for emirate, area, launch status, type, budget, completion and developer; 24 a page)
· `/projects/<project>` · `/areas` and `/areas/<area>` (one guide per community, grouped by emirate) · `/developers` and `/developers/<developer>` · `/apartments`,
`/townhouses`, `/villas` · `/why-dubai` · `/golden-visa` · `/faq` · `/about` · `/contact` · blog and news (from the MBR
desk; in the menu from day one, empty until the first article) · legal pages · `/site-map`.

## Updating the projects
The project list comes from the MBR desk. Nothing needs doing in this folder.

1. In the desk, open **Update properties**, paste a REM token and run the update. It brings the desk's copy of every REM
   project up to date (Net Capital's rule: every project on REM, all emirates) and reports what changed.
2. Rebuild the site (Vercel: Deployments → the latest one → **Redeploy**, or a Deploy Hook saved in the desk). Before each
   build, `scripts/pull-catalogue.ts` copies the list from the MBR API into the two `data/` files and the picture step
   downloads anything new. The running site reads those files; it does not ask the API between builds
   (`catalogue.runtime` in `sites/prelaunchuae/site.config.ts`).

The desk keeps every project whole. Net Capital's lighter cut is made in `src/data/slim.ts` on the way in: no private
projects, no developer descriptions, the cover plus 4 gallery pictures and 4 floor plans for a project still selling, the
cover only for one sold out, and a project the site's checks would reject is left out and named in `reports/catalogue.md`.

The build keeps the saved `data/` files, and says so in its log, when the API cannot be reached, has no projects for this
site yet, or holds far fewer than the saved files (an update that stopped part-way). Commit the refreshed `data/` files
now and then, so that fallback stays recent.

By hand, without the desk (needs a REM token on this computer):
1. Copy a fresh `auth_token` from off-plan.remapp.ae (browser → Application → Local Storage).
2. `REMAPP_TOKEN=... npm run fetch:data` downloads every portal project into `exports/` (large, never committed).
3. `npm run build:catalogue` makes the same cut from that export and writes the two `data/` files.
4. `npm run check:data`, then build with `CATALOGUE_SOURCE=files npm run build` (so the API list does not replace it).

## Useful commands
| Command | What it does |
|---|---|
| `npm run check:placeholders` | Lists contact and licence details still missing |
| `npm run check:data` | Checks the data files and lists the flags for MBR |
| `npm run pull:catalogue` | Copies the project list from the MBR API into `data/` (runs before every build) |
| `npm run sync:images` | Downloads and shrinks any new pictures |
| `npm run check:seo` | Checks every built page: titles, descriptions, H1, canonical, alt text, schema, broken links |
| `npm run check:budget` | Page-size budget (also runs after every build) |
| `npm test` | Automated checks of the data, filters, forms and blog code |

## Rules this codebase keeps
- Forms send enquiries to the MBR lead desk (`mbrbackend.wellnessz.in`), tagged as Net Capital. No analytics, pixels or third-party scripts.
- No invented facts. Missing data shows nothing, or "On request". Developer marketing text is never published.
- Pictures are downloaded once and served from this site. Nothing is loaded from the portal.
- Every page is static HTML; animations use transform and opacity only and respect reduced-motion settings.
