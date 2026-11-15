import Link from 'next/link';
import { config } from '@/site';
import { hasPosts } from '@/lib/content';
import { Icon } from '../ui/Icon';
import { HeaderShell } from './HeaderShell';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';

/** Navigation links. "Blog" appears once there is at least one article from the desk or the older files. */
export async function navItems() {
  const posts = config.nav.some((n) => n.requires === 'posts') ? await hasPosts() : false;
  return config.nav.filter((n) => n.requires !== 'posts' || posts);
}

/**
 * 1 · Fixed header: black glass with a gold line along the top, reversed logo, navigation and one gold "Register interest"
 * (the enquiry form is the site's only channel: no phone, email or WhatsApp). Fixed 72px height, so it never shifts the page.
 */
export async function Header() {
  const items = await navItems();
  return (
    <>
      <a href="#main" className="skip-link btn btn-dark btn-sm">Skip to content</a>
      <div id="top-sentinel" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-4" />
      <HeaderShell>
        <div className="container-site relative flex h-full items-center gap-6">
          <Link href="/" aria-label={`${config.name}, home`} className="inline-flex min-h-11 shrink-0 items-center">
            <Logo variant="compact" tone="reverse" width={150} className="logo-img h-auto w-[150px] sm:hidden" />
            <Logo tone="reverse" width={208} className="logo-img hidden h-auto w-[208px] sm:block" />
          </Link>
          <nav aria-label="Main" className="ml-auto hidden lg:flex lg:items-center">
            <NavLinks items={items} variant="bar" />
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-6">
            <a href="#register" className="btn btn-primary btn-sm hidden sm:inline-flex">{config.ctaLabel}</a>
            <button type="button" popoverTarget="site-menu" className="btn btn-icon border-line-strong bg-transparent text-body hover:border-gold hover:text-gold-hover lg:hidden" aria-label="Open menu">
              <Icon name="menu" className="size-6" />
            </button>
          </div>
        </div>
      </HeaderShell>

      <div id="site-menu" popover="auto" className="mobile-menu" aria-label="Menu">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
          <Logo variant="compact" tone="reverse" width={150} className="h-auto w-[150px]" lazy />
          <button type="button" popoverTarget="site-menu" popoverTargetAction="hide" className="btn btn-icon border-line-strong bg-transparent text-body hover:border-gold hover:text-gold-hover" aria-label="Close menu">
            <Icon name="close" className="size-6" />
          </button>
        </div>
        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-5 py-4">
          <NavLinks items={items} variant="menu" />
          <ul className="mt-6 grid gap-1 text-[14px] text-muted">
            {config.legalLinks.map((l) => (
              <li key={l.href}><Link href={l.href} className="flex min-h-11 items-center transition-colors hover:text-gold-hover">{l.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-3 border-t border-line p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <a href="#register" className="btn btn-primary">{config.ctaLabel}</a>
        </div>
      </div>
    </>
  );
}
