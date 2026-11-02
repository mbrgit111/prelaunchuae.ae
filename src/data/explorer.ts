/** The project index for the explorer: one small row per project, in the site's featured order. */
import 'server-only';
import type { IndexItem } from '@/components/forms/explorer-types';
import { featuredProjects } from './index.ts';
import { areaSlug } from './areas.ts';

export async function projectIndex(): Promise<IndexItem[]> {
  return (await featuredProjects()).map((p, k) => ({
    s: p.slug,
    n: p.name,
    d: p.developerName,
    ds: p.developerSlug,
    a: p.communityName,
    as: areaSlug(p.communityName),
    e: areaSlug(p.emirate),
    t: p.propertyTypes,
    b: p.bedrooms,
    st: p.status,
    p: p.status === 'sold-out' ? null : p.priceFrom,
    y: p.handover.year,
    hl: p.handover.label,
    r: p.completion === 'ready',
    c: p.createdAt.slice(0, 10),
    k,
    i: p.cover?.src ?? null,
    bl: p.bedroomsLabel,
    tl: p.propertyTypeLabels.join(', '),
    pl: p.paymentPlanLabel,
    ph: p.hasPostHandover,
  }));
}
