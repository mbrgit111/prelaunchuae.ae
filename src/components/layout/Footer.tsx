import Link from 'next/link';
import { config, contact } from '@/site';
import { getDevelopers } from '@/data';
import { getAreas } from '@/data/areas';
import { mailHref, showPlaceholders, telHref, waHref } from '@/lib/contact';
import { Icon, type IconName } from '../ui/Icon';
import { Ph } from '../ui/Placeholder';
import { navItems } from './Header';
import { Logo } from './Logo';
import { LicenceLine } from '../ui/Licence';

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      {/* Gold micro label with a short gold rule under it */}
      <h2 className="text-label mb-5 grid gap-2.5 after:block after:h-px after:w-6 after:bg-gold after:content-['']">{title}</h2>
      <ul className="grid gap-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex items-center gap-0 text-muted transition-all hover:gap-2 hover:text-gold-hover before:h-px before:w-0 before:bg-gold before:transition-all before:content-[''] hover:before:w-3"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Contact lines stay null-guarded: contact.ts is all null (the enquiry form is the only channel), so these render nothing.
function ContactLine({ icon, href, text, ph }: { icon: IconName; href: string | null; text: string | null; ph: string }) {
  if (!text && !href) {
    return showPlaceholders ? <li className="flex items-center gap-3"><Icon name={icon} className="size-4 text-gold" /><Ph label={ph} /></li> : null;
  }
  return (
    <li className="flex items-start gap-3">
      <Icon name={icon} className="mt-1 size-4 text-gold" />
      {href ? (
        <a href={href} className="text-body hover:text-gold-hover">{text}</a>
      ) : (
        <span className="text-body">{text}</span>
      )}
    </li>
  );
}

/** 22 · Footer on every page: about, links, projects, developers, licence details, disclaimer and legal links, on black with the gold grid. */
export async function Footer() {
  const developers = (await getDevelopers()).slice(0, 6);
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark relative overflow-hidden border-t border-line bg-page text-body">
      <div aria-hidden="true" className="gold-grid pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
      <div className="container-site relative grid gap-12 py-16 md:py-20 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
        <div className="grid content-start gap-6">
          <Link href="/" aria-label={`${config.name}, home`} className="inline-flex min-h-11 items-center justify-self-start">
            <Logo variant="stacked" tone="reverse" width={232} lazy />
          </Link>
          <p className="max-w-sm text-[14px] leading-relaxed text-muted">{config.footerAbout}</p>
          <ul className="grid gap-3 text-[15px] empty:hidden">
            <ContactLine icon="phone" href={telHref()} text={contact.phone.display} ph="Phone" />
            {waHref() ? <ContactLine icon="whatsapp" href={waHref()!} text="Chat on WhatsApp" ph="WhatsApp" /> : null}
            <ContactLine icon="mail" href={mailHref()} text={contact.email} ph="Email" />
          </ul>
          <a href="#register" className="arrow-link justify-self-start">
            {config.ctaLabel} <Icon name="arrow-right" className="size-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
          <Col
            title="Explore"
            links={(await navItems()).filter((n) => n.href !== '/areas' && n.href !== '/developers')}
          />
          <Col title="Developers" links={[...developers.map((d) => ({ label: d.name, href: `/developers/${d.slug}` })), { label: 'All developers', href: '/developers' }]} />
          <Col
            title="Areas"
            links={[...(await getAreas()).slice(0, 6).map((a) => ({ label: a.name, href: `/areas/${a.slug}` })), { label: 'All areas', href: '/areas' }]}
          />
        </div>
      </div>

      <div className="relative border-t border-line">
        <div className="container-site grid gap-4 py-8 text-[13px] leading-relaxed text-muted">
          <p className="font-semibold text-heading">{config.name}, operated by {config.operatedBy}</p>
          <LicenceLine />
          <p className="max-w-4xl">
            <span className="font-semibold text-body">Disclaimer: </span>
            {config.name} is a property information website operated by {config.operatedBy}. It is not the official website of any developer, community
            or government authority. Project names, images, prices, payment plans and handover dates come from developer
            information, are subject to availability and can change without notice; images may be artist’s impressions. Nothing on this site is an
            offer, a contract, or financial or legal advice, and nothing here is a promise of returns or future value. Please confirm every detail
            before you commit. <Link href="/disclaimer" className="text-gold underline underline-offset-2 hover:text-gold-hover">Full disclaimer</Link>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {config.legalLinks.map((l) => (
                <li key={l.href}><Link href={l.href} className="transition-colors hover:text-gold-hover">{l.label}</Link></li>
              ))}
            </ul>
            <p>© {year} {config.operatedBy}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
