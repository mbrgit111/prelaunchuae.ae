import Image from 'next/image';
import type { MediaImage } from '@/data';
import { Breadcrumbs } from './Breadcrumbs';
import { BrandMark } from './BrandMark';

/** Header band for inner pages: datum ground with the survey grid, breadcrumbs, label, H1, lede; optional picture on the right. */
export function PageHero({ label, title, lede, crumbs, image, children }: {
  label?: string;
  title: string;
  lede?: React.ReactNode;
  crumbs: { name: string; path: string }[];
  image?: MediaImage | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-datum text-sand">
      <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-[0.12]" />
      <div className={image ? 'relative lg:grid lg:grid-cols-[1.1fr_0.9fr]' : 'relative'}>
        {image ? (
          <div className="relative aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[480px]">
            <Image src={image.src} alt={image.alt} fill priority fetchPriority="high" sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-datum via-transparent lg:bg-gradient-to-r lg:from-datum lg:via-datum/0" />
          </div>
        ) : (
          <BrandMark variant="outline" animate={false} className="pointer-events-none absolute -right-10 top-1/2 h-[150%] w-auto -translate-y-1/2 text-sage opacity-[0.1]" />
        )}
        <div className="container-site relative grid content-center gap-5 py-12 md:py-16 lg:py-20">
          <Breadcrumbs items={crumbs} tone="dark" />
          {label ? <p className="text-label flex items-center gap-2.5"><span aria-hidden="true" className="size-2 bg-survey" />{label}</p> : null}
          <h1 className="text-display max-w-4xl !text-[clamp(2.5rem,1.7rem+2.6vw,3.75rem)]">{title}</h1>
          {lede ? <div className="text-lede max-w-2xl text-sand/85">{lede}</div> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
