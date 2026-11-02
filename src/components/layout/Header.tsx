import Link from 'next/link';
import { config, contact } from '@/site';
import { hasPosts } from '@/lib/content';
import { mailHref, showPlaceholders, telHref, waHref } from '@/lib/contact';
import { Icon } from '../ui/Icon';
import { HeaderShell } from './HeaderShell';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';

/** Navigation links. "Blog" appears once there is at least one article from the desk or the older files. */
export async function navItems() {
  const posts = config.nav.some((n) => n.requires === 'posts') ? await hasPosts() : false;
  return config.nav.filter((n) => n.requires !== 'posts' || posts);
}

function ContactButton({ kind }: { kind: 'phone' | 'mail' }) {
  const href = kind === 'phone' ? telHref() : mailHref();
  const label = kind === 'phone' ? `Call ${config.name}${contact.phone.display ? ` on ${contact.phone.display}` : ''}` : `Email ${config.name}${contact.email ? ` at ${contact.email}` : ''}`;
  if (!href && !showPlaceholders) return null;
  return (
    <a
      href={href ?? '#'}
      aria-label={href ? label : `${label} (from MBR)`}
      title={href ? undefined : `[${kind === 'phone' ? 'PHONE' : 'EMAIL'} FROM MBR]`}
      className={`btn btn-icon border-line bg-white text-ink hover:border-ink ${href ? '' : 'border-dashed text-survey-deep'}`}
    >
      <Icon name={kind} className="size-5" />
    </a>
  );
}


/** Green WhatsApp button: opens the bot chat. */
function WhatsAppButton({ wide = false }: { wide?: boolean }) {
  const href = waHref();
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener" aria-label={`WhatsApp ${config.name}`} className={`btn btn-wa btn-sm gap-2 ${wide ? 'min-h-11 flex-1' : 'max-xl:w-11 max-xl:px-0'}`}>
      <Icon name="whatsapp" className="size-5 shrink-0" />
      <span aria-hidden="true" className={wide ? '' : 'hidden xl:inline'}>WhatsApp</span>
    </a>
  );
}

/** 1 · Sticky header: wordmark, navigation, call, email, one "Register interest". Fixed height, so it never shifts the page. */
export async function Header() {
  const items = await navItems();
  return (
    <>
      <a href="#main" className="skip-link btn btn-dark btn-sm">Skip to content</a>
      <div id="top-sentinel" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-4" />
      <HeaderShell>
        <div className="container-site relative flex h-full items-center gap-6">
          <Link href="/" aria-label={`${config.name}, home`} className="inline-flex min-h-11 shrink-0 items-center">
            <Logo variant="compact" width={150} className="logo-img h-auto w-[150px] sm:hidden" />
            <Logo width={208} className="logo-img hidden h-auto w-[208px] sm:block" />
          </Link>
          <nav aria-label="Main" className="ml-auto hidden lg:flex lg:items-center">
            <NavLinks items={items} variant="bar" />
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-6">
            <span className="hidden items-center gap-2 lg:flex">
              <ContactButton kind="phone" />
              <WhatsAppButton />
              <ContactButton kind="mail" />
            </span>
            <a href="#register" className="btn btn-primary btn-sm hidden sm:inline-flex">{config.ctaLabel}</a>
            <button type="button" popoverTarget="site-menu" className="btn btn-icon border-line bg-white lg:hidden" aria-label="Open menu">
              <Icon name="menu" className="size-6" />
            </button>
          </div>
        </div>
      </HeaderShell>

      <div id="site-menu" popover="auto" className="mobile-menu bg-white text-ink" aria-label="Menu">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
          <Logo variant="compact" width={150} className="h-auto w-[150px]" lazy />
          <button type="button" popoverTarget="site-menu" popoverTargetAction="hide" className="btn btn-icon border-line" aria-label="Close menu">
            <Icon name="close" className="size-6" />
          </button>
        </div>
        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-5 py-4">
          <NavLinks items={items} variant="menu" />
          <ul className="mt-6 grid gap-1 text-[15px] text-muted">
            {config.legalLinks.map((l) => (
              <li key={l.href}><Link href={l.href} className="flex min-h-11 items-center hover:text-survey-deep">{l.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-3 border-t border-line p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <ContactButton kind="phone" />
            <ContactButton kind="mail" />
            <WhatsAppButton wide />
          </div>
          <a href="#register" className="btn btn-primary">{config.ctaLabel}</a>
        </div>
      </div>
    </>
  );
}
