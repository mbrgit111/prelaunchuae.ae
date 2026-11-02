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
      <h2 className="text-label mb-4">{title}</h2>
      <ul className="grid gap-2.5 text-[15px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-white/80 transition-colors hover:text-plot">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactLine({ icon, href, text, ph }: { icon: IconName; href: string | null; text: string | null; ph: string }) {
  if (!text && !href) {
    return showPlaceholders ? <li className="flex items-center gap-3"><Icon name={icon} className="size-4 text-plot" /><Ph label={ph} /></li> : null;
  }
  return (
    <li className="flex items-start gap-3">
      <Icon name={icon} className="mt-1 size-4 text-plot" />
      {href ? (
        <a href={href} className="text-white/85 hover:text-plot">{text}</a>
      ) : (
        <span className="text-white/85">{text}</span>
      )}
    </li>
  );
}

/** 22 · Footer on every page: about, links, projects, developers, phone and email, licence details, disclaimer and legal links. */
export async function Footer() {
  const developers = (await getDevelopers()).slice(0, 6);
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark relative overflow-hidden bg-datum text-sand">
      <div className="container-site grid gap-12 py-16 md:py-20 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
        <div className="grid content-start gap-6">
          <Link href="/" aria-label={`${config.name}, home`} className="inline-flex min-h-11 items-center justify-self-start">
            <Logo variant="stacked" tone="reverse" width={232} lazy />
          </Link>
          <p className="max-w-sm text-[15px] text-sand/75">{config.footerAbout}</p>
          <ul className="grid gap-3 text-[15px]">
            <ContactLine icon="phone" href={telHref()} text={contact.phone.display} ph="Phone" />
            {waHref() ? <ContactLine icon="whatsapp" href={waHref()!} text="Chat on WhatsApp" ph="WhatsApp" /> : null}
            <ContactLine icon="mail" href={mailHref()} text={contact.email} ph="Email" />
          </ul>
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

      <div className="border-t border-white/10">
        <div className="container-site grid gap-4 py-8 text-[13px] leading-relaxed text-white/65">
          <p className="font-semibold text-white">{config.name}, operated by {config.operatedBy}</p>
          <LicenceLine />
          <p className="max-w-4xl">
            <span className="font-semibold text-white/85">Disclaimer: </span>
            {config.name} is a property information website operated by {config.operatedBy}. It is not the official website of any developer, community
            or government authority. Project names, images, prices, payment plans and handover dates come from developer
            information, are subject to availability and can change without notice; images may be artist’s impressions. Nothing on this site is an
            offer, a contract, or financial or legal advice, and nothing here is a promise of returns or future value. Please confirm every detail
            before you commit. <Link href="/disclaimer" className="underline underline-offset-2 hover:text-plot">Full disclaimer</Link>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {config.legalLinks.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-plot">{l.label}</Link></li>
              ))}
            </ul>
            <p>© {year} {config.operatedBy}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
