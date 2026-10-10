"use client";

export type ZoneBoardRow = {
  label: string;
  sub?: string;
  value: number;
  display: string;
  color: string;
};

export type ZoneBoardZone = {
  id: string;
  name: string;
  members: string[];
  badge: { label: string; color: string };
  rows: ZoneBoardRow[];
  note?: string;
  accent: string;
  onSelect?: () => void;
};

export type ZoneBoardProps = {
  kicker: string;
  title: string;
  subtitle: string;
  summaryChips: { label: string; color: string }[];
  zones: ZoneBoardZone[];
  footer?: {
    kicker: string;
    headline: string;
    stats: { label: string; value: string; color: string }[];
  };
  className?: string;
};

function BarRow({ row, max }: { row: ZoneBoardRow; max: number }) {
  const width = max > 0 ? Math.max(4, (row.value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3.5rem] items-center gap-2 text-sm">
      <div className="min-w-0">
        <p className="font-semibold text-text-primary truncate">{row.label}</p>
        {row.sub && (
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted truncate">
            {row.sub}
          </p>
        )}
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${width}%`, backgroundColor: row.color }}
        />
      </div>
      <p className="text-right text-xs font-bold tabular-nums text-text-primary">
        {row.display}
      </p>
    </div>
  );
}

export default function ZoneBoard({
  kicker,
  title,
  subtitle,
  summaryChips,
  zones,
  footer,
  className = "",
}: ZoneBoardProps) {
  return (
    <div
      className={`rounded-3xl border border-border-subtle bg-gradient-to-b from-lime-50/40 to-white p-5 md:p-8 ${className}`}
    >
      <p className="text-label-caps font-bold uppercase tracking-widest text-primary">
        {kicker}
      </p>
      <h3 className="mt-2 font-landing-display text-headline-xl text-text-primary tracking-tight">
        {title}
      </h3>
      <p className="mt-1 max-w-2xl text-body-md text-text-secondary">{subtitle}</p>

      {summaryChips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {summaryChips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
              style={{ backgroundColor: chip.color }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {zones.map((zone) => {
          const max = Math.max(...zone.rows.map((r) => r.value), 1);
          const interactive = Boolean(zone.onSelect);
          return (
            <article
              key={zone.id}
              className={`rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm ${
                interactive ? "cursor-pointer hover:shadow-md transition-shadow" : ""
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: zone.accent }}
              onClick={zone.onSelect}
              onKeyDown={
                zone.onSelect
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        zone.onSelect?.();
                      }
                    }
                  : undefined
              }
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-landing-display text-lg font-bold text-text-primary">
                    {zone.name}
                  </h4>
                  <p className="mt-0.5 text-[10px] leading-snug text-text-muted line-clamp-2">
                    {zone.members.join(" · ")}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: zone.badge.color }}
                >
                  {zone.badge.label}
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {zone.rows.map((row) => (
                  <BarRow key={`${zone.id}-${row.label}`} row={row} max={max} />
                ))}
              </div>
              {zone.note && (
                <p className="mt-3 text-[11px] italic text-text-muted">{zone.note}</p>
              )}
            </article>
          );
        })}
      </div>

      {footer && (
        <div className="mt-8 rounded-2xl bg-slate-900 px-5 py-6 text-white md:px-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {footer.kicker}
          </p>
          <p className="mt-2 font-landing-display text-xl font-bold">{footer.headline}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {footer.stats.map((stat) => (
              <div key={stat.label} className="flex gap-3">
                <span
                  className="mt-1 h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: stat.color }}
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-semibold text-slate-300">{stat.label}</p>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
