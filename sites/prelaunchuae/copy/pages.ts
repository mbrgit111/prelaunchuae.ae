/** Words for the areas, why Dubai, Golden Visa, about and contact pages. Claims carry a review flag until MBR adds sources. */
export const pages = {
  areas: {
    title: 'Areas',
    h1: 'New launches by area',
    lede: 'Every community with a pre-launch or new launch, across the UAE. Open an area to compare its launches, developers, prices and handover dates.',
  },
  why: {
    h1: 'Why buyers look at Dubai',
    metaTitle: 'Why Buy Off-Plan in Dubai',
    lede: 'The general case for buying in Dubai, kept factual. For any point you rely on, ask us for the source.',
    offPlan: {
      title: 'Why buy off-plan',
      points: [
        { title: 'Payments spread over construction', body: 'Off-plan payments are usually split across booking, construction milestones and handover, and some plans continue after handover. Each project publishes its own split.' },
        { title: 'Early choice of units', body: 'Developers release projects in phases. Registering early gives you sight of launch availability, floor plans and pricing as they are released.' },
        { title: 'Payments held in escrow', body: 'In Dubai, payments for registered off-plan projects go into escrow accounts regulated by the Dubai Land Department.', flag: 'SOURCE REQUIRED' },
      ],
    },
  },
  goldenVisa: {
    h1: 'Golden Visa guide for property buyers',
    metaTitle: 'Golden Visa Through Property: A Guide',
    lede: 'A plain overview of how property can relate to the UAE’s long-term Golden Visa, and what to check before you rely on it.',
    flag: 'VERIFY CURRENT RULES',
    sections: [
      { title: 'What the Golden Visa is', body: 'The UAE Golden Visa is a long-term residence visa. Some property owners are eligible, alongside other groups such as entrepreneurs and skilled professionals.' },
      { title: 'How property can qualify', body: 'Eligibility for property owners depends on rules set by the authorities, including a minimum property value, how ownership is held, whether the property is financed, and whether off-plan property counts. These rules change over time, so we confirm the current version before you reserve.' },
      { title: 'Off-plan property', body: 'Whether an off-plan unit counts, and at what stage, depends on the current rules and on the developer and project. Ask us to check a specific unit.' },
      { title: 'What to prepare', body: 'Typical documents include your passport, the title deed or sale agreement, and proof of payment. The exact list depends on your case and the current process.' },
    ],
    disclaimer: 'General information only, not legal or immigration advice. Rules are set by the UAE authorities and can change without notice.',
  },
  about: {
    h1: 'About PrelaunchUAE',
    metaTitle: 'About Us',
    lede: 'New launches across the UAE, shown before they are everywhere. Plain facts, developer-approved, no hype. PrelaunchUAE is a brand of MBR Properties.',
    sections: [
      { title: 'Why only launches', body: 'The best choice of units, and the most flexible payment plans, are usually there when a project first launches. PrelaunchUAE lists only projects at the pre-launch or new-launch stage, in Dubai and the other emirates, and leaves out projects that are already selling down or sold out, so you can weigh one launch against another on the same terms.' },
      { title: 'How we work', body: 'Every price, payment plan and date on this site comes from developer information. Before you commit, we confirm the current figures with the developer and set out the fees.' },
      { title: 'What we never do', body: 'We do not promise returns, price growth or rankings, and we do not quote figures the developer has not approved.' },
    ],
  },
  contact: {
    h1: 'Contact PrelaunchUAE',
    metaTitle: 'Contact Us',
    lede: 'Call, email or send an enquiry. An advisor replies with current availability, floor plans and payment plans.',
  },
  faq: { h1: 'New launches in the UAE: questions', metaTitle: 'UAE New Launch Property FAQ' },
} as const;
