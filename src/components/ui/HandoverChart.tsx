/** Projects by expected handover year. One series, one hue (gold on the dark surface), values labelled, table view. */
export function HandoverChart({ years, ready }: { years: { year: number; count: number }[]; ready: number }) {
  const rows = [...(ready ? [{ key: 'Ready', count: ready }] : []), ...years.map((y) => ({ key: String(y.year), count: y.count }))];
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <figure className="m-0 border border-line bg-surface p-5 md:p-6">
      <figcaption className="text-label mb-5">Projects by expected handover</figcaption>
      <ul className="grid gap-[3px]">
        {rows.map((r) => (
          <li key={r.key} className="group relative grid grid-cols-[56px_1fr] items-center gap-3" tabIndex={0} aria-label={`${r.key}: ${r.count} project${r.count === 1 ? '' : 's'}`}>
            <span className="text-sm tabular-nums text-muted">{r.key}</span>
            <span className="flex items-center gap-2">
              <span className="h-6 bg-gradient-to-r from-gold-deep to-gold transition-opacity group-hover:opacity-80" style={{ width: `${(r.count / max) * 88}%` }} />
              <span className="text-sm font-semibold tabular-nums text-heading">{r.count}</span>
            </span>
            <span role="tooltip" className="pointer-events-none absolute -top-9 left-16 z-10 whitespace-nowrap border border-line-strong bg-surface-3 px-2.5 py-1 text-xs text-heading opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
              {r.key === 'Ready' ? 'Ready now' : `Handover ${r.key}`}: {r.count} project{r.count === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-semibold text-gold hover:text-gold-hover">Show as table</summary>
        <table className="mt-3 w-full text-left">
          <thead><tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.12em] text-muted"><th scope="col" className="py-2 font-semibold">Handover</th><th scope="col" className="py-2 text-right font-semibold">Projects</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.key} className="border-b border-line last:border-0"><td className="py-2">{r.key}</td><td className="py-2 text-right tabular-nums">{r.count}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
