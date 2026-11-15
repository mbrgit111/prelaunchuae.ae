import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { Icon } from '@/components/ui/Icon';

export const metadata = { title: 'Page not found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <section className="on-dark relative overflow-hidden bg-page py-20 md:py-28">
      <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div className="container-site relative grid max-w-2xl justify-items-start gap-6">
        <Logo variant="stacked" width={200} lazy />
        <p className="eyebrow-pill"><span aria-hidden="true" className="eyebrow-dot" />Error 404</p>
        <h1 className="text-display !text-[clamp(2.75rem,2rem+2vw,3.75rem)]">Page not <span className="text-strong">found</span></h1>
        <p className="text-lede text-body">This page does not exist, or it has moved. Start from the projects or the area guide.</p>
        {/* id="register": the header and footer "Register interest" links land here; the form itself lives on /contact */}
        <div id="register" className="flex flex-wrap gap-3">
          <Link href="/projects" className="btn btn-primary">View projects <Icon name="arrow-right" className="size-[18px]" /></Link>
          <Link href="/areas" className="btn btn-secondary">Browse by area</Link>
          <Link href="/contact#register" className="btn btn-secondary">Register interest</Link>
        </div>
      </div>
    </section>
  );
}
