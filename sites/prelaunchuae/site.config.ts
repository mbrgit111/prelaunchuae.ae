import type { SiteConfig } from '../types.ts';

export const config: SiteConfig = {
  key: 'prelaunchuae',
  contentKey: 'prelaunchuae',
  name: 'PrelaunchUAE',
  operatedBy: 'MBR Properties',
  domain: 'prelaunchuae.com',
  url: 'https://prelaunchuae.com',
  locale: 'en-AE',
  alternateLocales: {},
  // PrelaunchUAE lists only the REM portal's pre-launch and new-launch projects (MBR, 2 Nov 2026): not sold out, not
  // on general sale. About 110 projects, most in Dubai. The slug is the address of the area guide (/areas).
  community: {
    name: 'UAE',
    slug: 'areas',
    renameAreas: {
      'Bu kadra': 'Bukadra',
      'Jabal Ali First': 'Jebel Ali First',
      'Jabal Ali Second': 'Jebel Ali Second',
      'Jabal Ali Industrial 2': 'Jebel Ali Industrial 2',
      'Wadi al safa 5': 'Wadi Al Safa 5',
      'City Of Arabia': 'City of Arabia',
      'Dubai Investment Park 2': 'Dubai Investments Park 2',
    },
  },
  scope: 'all',
  // The running site asks the MBR desk for the list (and holds it, checking its version on each new page), so the daily
  // REM update (9:00) shows without a Vercel build. The desk then calls /api/revalidate to refresh cached pages at once.
  // Only New launch and Coming soon are kept: src/data/slim.ts cuts the API list the same way as the build does.
  catalogue: { runtime: 'api' },
  tagline: 'UAE · New launches',
  description:
    'See pre-launch and new-launch projects across Dubai and the UAE before the market does: area, developer, unit types, payment plan and handover date, then register your interest with PrelaunchUAE.',
  keywords: [
    'pre launch projects Dubai',
    'new launch projects Dubai',
    'off-plan new launches UAE',
    'pre-launch property Dubai',
    'new launch apartments Dubai',
    'new launch villas and townhouses UAE',
    'Abu Dhabi new launch projects',
    'Dubai payment plan new launches',
  ],
  // Every page is in the menu (nothing held back): the blog has its page from day one, empty or not.
  nav: [
    { label: 'Launches', href: '/projects' },
    { label: 'Areas', href: '/areas' },
    { label: 'Developers', href: '/developers' },
    { label: 'Why Dubai', href: '/why-dubai' },
    { label: 'Golden Visa', href: '/golden-visa' },
    { label: 'Blog', href: '/blog' },
    { label: 'News', href: '/news' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  ctaLabel: 'Register interest',
  logo: {
    // Brand kit v1.0: primary horizontal for the header, compact where the subline would fall under 7 px, stacked for
    // the footer. Reversed versions sit on Midnight Ink. Supplied files only, never re-typeset.
    horizontal: '/brand/prelaunchuae-horizontal.svg',
    horizontalReverse: '/brand/prelaunchuae-horizontal-reversed.svg',
    compact: '/brand/prelaunchuae-compact.svg',
    compactReverse: '/brand/prelaunchuae-compact-reversed.svg',
    stacked: '/brand/prelaunchuae-stacked.svg',
    stackedReverse: '/brand/prelaunchuae-stacked-reversed.svg',
    icon: '/brand/prelaunchuae-mark.svg',
    horizontalRatio: 406.38 / 71.35,
    compactRatio: 377.48 / 47.1,
    stackedRatio: 321.34 / 190.35,
  },
  ogImage: { src: '/og-image-1200x630.png', width: 1200, height: 630 },
  themeColor: '#0B1F33',
  footerAbout:
    'PrelaunchUAE shows new launches across Dubai and the UAE before they are everywhere: area, developer, unit types, payment plan and handover, side by side. A brand of MBR Properties. Every figure comes from developer information and is confirmed before you commit.',
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Cookie policy', href: '/cookie-policy' },
    { label: 'Sitemap', href: '/site-map' },
  ],
};
