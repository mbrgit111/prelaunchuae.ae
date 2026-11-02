import { range, type PlaceRow } from '@/data/insights';
import { Icon, type IconName } from '../ui/Icon';
import { Section } from '../ui/Section';

const ICON: Record<string, IconName> = { airport: 'plane', school: 'building', communities_districts: 'map', malls: 'building', parks: 'sun', beaches: 'sun', landmarks: 'compass', business: 'building' };

export function PlaceList({ rows }: { rows: PlaceRow[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r, i) => (
        <li key={r.name} data-reveal style={{ '--i': i % 3 } as React.CSSProperties} className="card flex items-start gap-4 p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-brand-sm bg-plot text-datum">
            <Icon name={ICON[r.categoryCode ?? ''] ?? 'pin'} className="size-5" />
          </span>
          <span className="grid gap-1">
            <span className="font-semibold leading-snug">{r.name}</span>
            {r.category ? <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{r.category}</span> : null}
            <span className="text-[15px] tabular-nums">
              {[range(r.minTime, r.maxTime, 'min'), range(r.minKm, r.maxKm, 'km')].filter(Boolean).join(' · ')}
            </span>
            <span className="text-xs text-muted">Listed by {r.projects} project{r.projects === 1 ? '' : 's'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
