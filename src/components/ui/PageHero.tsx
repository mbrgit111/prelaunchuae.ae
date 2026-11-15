import Image from 'next/image';
import type { MediaImage } from '@/data';
import { Breadcrumbs } from './Breadcrumbs';
import { BrandMark } from './BrandMark';
import { Eyebrow, withHighlight } from './Section';

/** Header band for inner pages: dark band with the faint gold grid and glows, breadcrumbs, pill label, H1, lede; optional picture on the right. */
export function PageHero({ label, title, highlight, lede, crumbs, image, children }: {
  label?: string;
  title: string;
  /** A word or phrase of the title shown in gold. */
  highlight?: string;
  lede?: React.ReactNode;
  crumbs: { name: string; path: string }[];
  image?: MediaImage | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden border-b border-line bg-band text-body">
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
      <div className={image ? 'relative lg:grid lg:grid-cols-[1.1fr_0.9fr]' : 'relative'}>
        {image ? (
          <div className="relative aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[480px]">
            <Image src={image.src} alt={image.alt} fill priority fetchPriority="high" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-band via-transparent lg:bg-gradient-to-r lg:from-band lg:via-band/0" />
          </div>
        ) : (
          <BrandMark variant="outline" animate={false} className="pointer-events-none absolute -right-10 top-1/2 h-[150%] w-auto -translate-y-1/2 text-gold opacity-[0.07]" />
        )}
        <div className="container-site relative grid content-center gap-5 py-12 md:py-16 lg:py-20">
          <Breadcrumbs items={crumbs} tone="dark" />
          {label ? <Eyebrow variant="pill" className="justify-self-start">{label}</Eyebrow> : null}
          <h1 className="text-display max-w-4xl !text-[clamp(2.5rem,1.7rem+2.6vw,3.75rem)]">{withHighlight(title, highlight)}</h1>
          {lede ? <div className="text-lede max-w-2xl text-body">{lede}</div> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
