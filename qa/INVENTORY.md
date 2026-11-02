# QA inventory: PrelaunchUAE (2 Nov 2026)

Site: Next.js 16 production build (`npm run build`, 286 pages), served at http://localhost:3450 (`npm start -- -p 3450`). Source: this folder. No users or logins; the only roles are anonymous visitors on phone (375x812, 320x640) and desktop (1440x900).

## What was built
A copy of the Net Capital engine in the PrelaunchUAE brand (brand guidelines v1.0): Midnight Ink #0B1F33, Launch Amber #E07A2E, Desert Sand #F4EFE6, Slate #5A6573, Mist #A9B4C2; Sora (headlines) and Manrope (text); logo supplied files only (primary horizontal >=160 px wide, compact horizontal on phones >=100 px). Amber is for shapes, large type and buttons WITH INK TEXT, never white text on amber, never small body copy.

## Rule under test: pre-launch only
Data = REM catalogue, status `launch` (New launch) or `pending` (Coming soon). Dropped before the site sees them: `available` (ready to buy / on sale) and `sold_out`. Today 125 projects, 67 areas, 94 developers, 5 emirates (Dubai 99, Abu Dhabi 14, RAK 9, Ajman 2, Sharjah 1). Saved in `data/remapp-projects.json` (raw) and `data/remapp-projects-list.json`. Site-side statuses: `new-launch`, `coming-soon` only. `/projects-index.json` is the explorer's index (field `st` = status, `s` = slug).
Takedown: slugs `meriden-gate` and `avior` must answer 404 (developer notice 30 Oct 2026).

## Pages (all must answer 200 and appear in the menu, footer or sitemap as noted)
`/` home · `/projects` (+ `/projects/page/2..6`, 24 per page, explorer with filters Emirate, Area, Launch status chips "New launches"/"Coming soon", Property type, Beds, Budget, Handover, Developer, search box, sort) · `/projects/<slug>` (125; page with H1, status tag, price "From AED" or "On request", unit table, payment plans, enquiry form id `#register`) · `/areas`, `/areas/<slug>` · `/developers`, `/developers/<slug>` · `/why-dubai` · `/golden-visa` · `/faq` · `/about` · `/contact` · `/blog` and `/news` (empty today; in menu; noindex while empty) · `/apartments`, `/townhouses`, `/villas`, `/apartments/{studio,1-bedroom,2-bedroom,3-bedroom,4-bedroom-plus}` · legal: `/privacy`, `/terms`, `/disclaimer`, `/cookie-policy` · `/site-map` · `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/manifest.webmanifest`, `/projects/<slug>/opengraph-image` (PNG 1200x630).
Desktop header menu (>=1024 px): Launches, Areas, Developers, Why Dubai, Golden Visa, Blog, then "More" (a details dropdown: News, FAQ, About, Contact). Phone menu (popover from the hamburger button, aria-label "Open menu") lists all ten plus legal links. Footer "Explore" column lists every nav page except Areas/Developers (own columns).

## Forms and money
Enquiry forms (`#register` on pages, contact page) post to `/api/leads`, which forwards to the live MBR lead desk. DO NOT submit a valid enquiry in QA: the `prelaunchuae` site key is not registered and the desk is production. Test validation (empty, bad phone, bad email, XSS strings) client-side only, and call `/api/leads` only with invalid bodies that fail before forwarding. No payments on the site.

## External dependencies
Backend https://mbrbackend.wellnessz.in (catalogue at build time, blog/content, leads), pictures are local static files in `public/media` (680 files). Nothing is loaded from third-party hosts at runtime (check no external requests except media host preconnect).

## Known decisions (not bugs)
- Email admin@prelaunchuae.com and phone +971 52 341 7272 are placeholders to confirm.
- Legal pages and Golden Visa/Why Dubai wording are drafts with review flags.
- Blog/News are empty and noindex until the first article.
- Hidden slugs stay 404 on purpose.
