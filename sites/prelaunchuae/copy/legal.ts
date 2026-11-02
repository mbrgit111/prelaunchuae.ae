/**
 * Legal page drafts. Neutral starting points, NOT legal advice: they must be reviewed by MBR's legal adviser before launch.
 * Company details are filled in from contact.ts.
 */
export interface LegalPage {
  slug: 'privacy' | 'terms' | 'disclaimer' | 'cookie-policy';
  title: string;
  metaDescription: string;
  sections: { title: string; body: string[] }[];
}

export const legalPages = (company: string, email: string | null): LegalPage[] => [
  {
    slug: 'privacy',
    title: 'Privacy policy',
    metaDescription: 'How PrelaunchUAE handles the details you share through this website.',
    sections: [
      { title: 'Who we are', body: [`This website is operated by ${company} under the name PrelaunchUAE.`] },
      { title: 'What we collect', body: ['When you send a form, we receive the details you enter (name, phone number, email address and any message), the page you sent it from, the project you asked about and any campaign tags in the web address.', 'We do not use analytics, advertising tags or tracking cookies on this website.'] },
      { title: 'Why we use it', body: ['To reply to your enquiry and send you the property information you asked for. We do not sell your details.'] },
      { title: 'How long we keep it', body: ['Only as long as needed to handle your enquiry and meet legal obligations.'] },
      { title: 'Your choices', body: [`You can ask to see, correct or delete your details at any time${email ? ` by writing to ${email}` : ''}.`] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of use',
    metaDescription: 'The terms that apply when you use the PrelaunchUAE website.',
    sections: [
      { title: 'Using this site', body: ['The information on this website is for general guidance about off-plan properties in Dubai. It is not an offer, a contract or advice.'] },
      { title: 'Property information', body: ['Prices, payment plans, availability and handover dates come from developer information, are subject to availability and can change without notice. Pictures are developer renders and may differ from the finished property.'] },
      { title: 'Links and content', body: ['Names, logos and pictures belong to their owners. You may not copy content from this site for commercial use without permission.'] },
      { title: 'Liability', body: [`To the extent the law allows, ${company} is not liable for decisions made on the basis of this website without confirming the details with us.`] },
    ],
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    metaDescription: 'Important information about prices, plans and investment content on PrelaunchUAE.',
    sections: [
      { title: 'Prices and availability', body: ['“From” prices are the lowest prices published by the developer for units available at the time of the data update, subject to availability. They are confirmed with the developer before you commit.'] },
      { title: 'No investment advice', body: ['Nothing on this site is financial, legal or tax advice, and nothing promises returns, rental income or price growth. Property values can fall as well as rise.'] },
      { title: 'Calculators', body: ['The payment and mortgage helper gives illustrative estimates only. Actual figures depend on the developer, the lender and your circumstances.'] },
      { title: 'Golden Visa', body: ['Golden Visa information is general and depends on rules set by the UAE authorities, which can change.'] },
    ],
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie policy',
    metaDescription: 'PrelaunchUAE does not use tracking cookies. Here is what the website stores in your browser.',
    sections: [
      { title: 'Cookies', body: ['This website does not set cookies and does not use analytics, advertising or social media tracking.'] },
      { title: 'Maps', body: ['No map service is contacted when a page opens. Project pages offer an “Open in Google Maps” link; Google’s own privacy policy applies once you follow it.'] },
      { title: 'Session storage', body: ['If you arrive from a campaign link, the campaign tags in the web address are kept in your browser’s session storage until you close the tab, so an enquiry you send can say which campaign it came from. Nothing is shared with third parties.'] },
      { title: 'Changes', body: ['If we add analytics or other tools that need cookies, this page will be updated and you will be asked for consent first.'] },
    ],
  },
];
