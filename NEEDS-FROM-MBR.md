# NEEDS FROM MBR: PrelaunchUAE
Contact details go into ONE file: `sites/prelaunchuae/contact.ts`. Licence and permits: `sites/prelaunchuae/compliance.ts`.
`npm run check:placeholders` lists anything missing. Nothing here is guessed: a missing value is simply not shown.
This site is a copy of the Net Capital engine (netcapital/) in the PrelaunchUAE brand (Brand Guidelines v1.0, Nov 2026).

## 1. Decide / do before it can go live
| # | Item | Status |
|---|------|--------|
| 1 | **Site key in the MBR desk.** Forms send enquiries tagged `prelaunchuae`, but the desk only knows the `netcapital` key and origins. Register a site `prelaunchuae` (origins `https://prelaunchuae.com`, `https://www.prelaunchuae.com`, `http://localhost:3000`), then set `LEAD_SITE_KEY` (and `CONTENT_SITE_KEY`) in Vercel. Until then the project list is pulled with Net Capital's read-only key and enquiries from this domain would be refused | open |
| 2 | **Contact channels.** DECIDED 3 Nov 2026: no phone, WhatsApp, email or office address anywhere on the site; the enquiry form is the only way to reach PrelaunchUAE. To bring one back, fill it in sites/prelaunchuae/contact.ts (every button and footer line reappears by itself). Note: the privacy policy draft names no email address for data requests; ask the legal adviser whether one is required | decided |
| 4 | **Domain.** `prelaunchuae.com` is the main address (as on the brand deck); `www` redirects to it. Change `url` in `site.config.ts` if you prefer www | confirm |
| 5 | **Takedowns.** Meriden Gate and Avior stay hidden (developer notice of 30 Oct 2026, `compliance.hiddenSlugs`), even though "show everything" was asked. Remove them from that list only if MBR says so | decided |
| 6 | **Pictures.** Renders and logos come from the REM portal. Confirm MBR may publish them on prelaunchuae.com | open |
| 7 | **Legal pages**, **Golden Visa** and **Why Dubai** wording: neutral drafts, flagged `[VERIFY CURRENT RULES]` / `[SOURCE REQUIRED]` | open |
| 8 | **Licence details** (RERA ORN, DLD BRN, trade licence, office address) and project Trakheesi permits | missing |
| 9 | **Google Search Console** property for prelaunchuae.com (send the HTML-tag code) | open |
| 10 | **Duplicate content.** offplan.ae, netcapital.ae and prelaunch.ae carry the same REM projects. Decide whether this domain should be indexed (see prelaunch.ae's `NEXT_PUBLIC_INDEX_REM_PAGES` approach) | open |

## 2. What "prelaunch" means here (decided 2 Nov 2026)
Only REM projects with status **New launch** (`launch`) or **Coming soon** (`pending`). Left out: everything already on general sale
(`available`, "ready to buy") and everything `sold_out`. Today: 125 projects (2,359 on REM), 67 areas, 94 developers, 5 emirates.
The rule is `isPrelaunch` in `src/data/slim.ts`; every other project is dropped before the site or the picture download sees it.

## 3. Optional content (each block stays empty until supplied)
Blog and News pages exist and are in the menu from day one (empty, `noindex` until the first article); articles come from the MBR desk.
Video tours: `data/videos.json`. Client stories (written consent needed): `sites/prelaunchuae/testimonials.ts`.

## Not used on purpose
Developer sales staff contacts, portal offer links, brochure PDF links, amenity photos, and developer descriptions (marketing copy that promises returns).
