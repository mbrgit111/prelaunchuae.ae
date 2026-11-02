/** The shape every site fills in. One folder per domain under sites/; the code in src/ is shared. */

export interface NavItem {
  label: string;
  href: string;
  /** Hide the link until this kind of content exists in the data. */
  requires?: 'posts';
}

export interface SiteConfig {
  key: string;
  /** The site's key in the MBR content API (its Sites list). Used to tag cached content, e.g. posts:<contentKey>. */
  contentKey: string;
  name: string; // "Dubai South Capital"
  operatedBy: string; // "MBR Properties"
  domain: string;
  url: string;
  locale: string; // "en-AE"
  /** Ready for Arabic: add { 'ar-AE': '/ar' } when the translation exists. */
  alternateLocales: Record<string, string>;
  /** The market the site covers ("UAE"; slug = address of the area guide), and how portal district names are shown. */
  community: { name: string; slug: string; alsoDistricts?: string[]; renameAreas?: Record<string, string> };
  scope: 'dubai-south-only' | 'all';
  /**
   * Where the running site reads its project list.
   * 'files': the list scripts/pull-catalogue.ts saved from the MBR API just before the build. Right for a list this
   * large: it is downloaded once per build, and the pictures downloaded in that same build always match it. What
   * "Update properties" changes in the desk arrives with the next build.
   * 'api': the running site also asks the MBR API (and holds the answer for ten minutes). Texts, prices and sales status
   * then arrive without a build, but a picture REM adds or replaces still waits for the next build.
   */
  catalogue: { runtime: 'api' | 'files' };
  tagline: string;
  description: string;
  keywords: string[];
  nav: NavItem[];
  ctaLabel: string;
  logo: {
    horizontal: string;
    horizontalReverse: string;
    compact: string;
    compactReverse: string;
    stacked: string;
    stackedReverse: string;
    icon: string;
    horizontalRatio: number; // width / height of the horizontal logo
    compactRatio: number;
    stackedRatio: number;
  };
  ogImage: { src: string; width: number; height: number };
  themeColor: string;
  footerAbout: string;
  legalLinks: NavItem[];
}

export interface ContactConfig {
  phone: { display: string | null; e164: string | null }; // e164 like "+971523417272"
  email: string | null;
  /** The number that answers on WhatsApp (e164). null = no WhatsApp buttons. */
  whatsapp?: { e164: string | null };
}

/** Licence and registration details shown site wide (footer, About, Contact). null = not supplied yet (not shown). */
export interface CompanyLicence {
  reraOrn: string | null; // RERA Office Registration Number (ORN)
  dldBrokerNumber: string | null; // DLD broker registration number (BRN)
  tradeLicence: string | null; // trade licence number
  tradeLicenceIssuer: string | null; // e.g. "Dubai DET"
  officeAddress: string | null; // full office address as on the trade licence
}

/** One project's advertising permit from the DLD Trakheesi system (the project may be advertised only with it). */
export interface ProjectPermit {
  trakheesiPermit: string; // Trakheesi advertising permit number
  madmounQr: string | null; // the permit's Madmoun QR code image, saved under public/permits/ (e.g. "/permits/hayat-6.png")
  reraProjectNumber: string | null; // RERA project registration number
  escrowAccount: string | null; // escrow account number and bank, as on the permit
}

export interface ComplianceConfig {
  company: CompanyLicence;
  /** Project slug -> its advertising permit. */
  projectPermits: Record<string, ProjectPermit>;
  /** true = a project page is published only once its permit is listed above. */
  publishOnlyWithPermit: boolean;
  /**
   * Project slugs that must not appear on this site (page, lists, sitemap). Used for developer takedowns and similar
   * requests. The address returns 404 until the slug is removed from this list.
   */
  hiddenSlugs?: string[];
}

/** A real client's words, published only with their written consent. */
export interface Testimonial {
  quote: string; // the client's own words
  name: string; // as the client agreed to be shown, e.g. "Andrew M."
  role: string; // e.g. "Homeowner, United Kingdom"
  rating?: 1 | 2 | 3 | 4 | 5; // only if the client gave one
  consent: true; // written consent is on file
}

export interface Site {
  config: SiteConfig;
  contact: ContactConfig;
  compliance: ComplianceConfig;
  testimonials: Testimonial[];
  copy: import('./prelaunchuae/copy/index.ts').SiteCopy;
  /** Project slugs whose cover pictures are used for site-wide images. Pictures always come from the data. */
  imagery: { hero: string; guide: string; about: string; featuredDeveloper: string | null };
}
