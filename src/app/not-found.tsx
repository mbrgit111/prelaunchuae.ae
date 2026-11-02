import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { Icon } from '@/components/ui/Icon';

export const metadata = { title: 'Page not found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <section className="on-sand bg-sand py-20 md:py-28">
      <div className="container-site grid max-w-2xl justify-items-start gap-6">
        <Logo variant="stacked" width={200} lazy />
        <p className="text-label">404</p>
        <h1 className="text-display !text-[clamp(2.75rem,2rem+2vw,3.75rem)]">Page not found</h1>
        <p className="text-lede text-muted">This page does not exist, or it has moved. Start from the projects or the area guide.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/projects" className="btn btn-dark">View projects <Icon name="arrow-right" className="size-[18px]" /></Link>
          <Link href="/areas" className="btn btn-secondary">Browse by area</Link>
        </div>
      </div>
    </section>
  );
}
