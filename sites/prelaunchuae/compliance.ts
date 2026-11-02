import type { ComplianceConfig } from '../types.ts';

/**
 * THE ONE FILE for licence, registration and advertising permit details of PrelaunchUAE (MBR Properties).
 * Nothing here is ever guessed: every value comes from MBR's own documents. A value left null is simply not shown
 * (preview builds show a "[... from MBR]" marker instead). `npm run check:placeholders` lists what is still missing.
 */
export const compliance: ComplianceConfig = {
  company: {
    reraOrn: null,
    dldBrokerNumber: null,
    tradeLicence: null,
    tradeLicenceIssuer: null,
    officeAddress: null,
  },
  // One entry per project, keyed by the project's address on the site (/projects/<slug>), e.g.
  // 'azizi-venice-11': { trakheesiPermit: '…', madmounQr: '/permits/azizi-venice-11.png', reraProjectNumber: '…', escrowAccount: '…' },
  projectPermits: {},
  // Step "do not publish a project page without its permit". While false, every project shows; while true, only
  // projects listed in projectPermits are published (pages, lists, sitemap). Same as Dubai South Capital (MBR, 6 Oct 2026): keep all visible.
  publishOnlyWithPermit: false,
  // Green Horizon Real Estate Development L.L.C. unauthorised-advertising notice (30 Oct 2026): remove Meriden Gate
  // immediately. Avior kept aligned with OffPlan hide list. Survives REM via API HIDDEN_PUBLIC_SLUGS + this list.
  hiddenSlugs: ['meriden-gate', 'avior'],
};
