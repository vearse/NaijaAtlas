const SOURCES = [
  { code: "INEC", label: "Elections", dot: "bg-primary-container" },
  { code: "NBS", label: "Statistics", dot: "bg-teal-600" },
  { code: "NPC", label: "Population", dot: "bg-amber-600" },
  { code: "UN SALB", label: "Boundaries", dot: "bg-slate-400" },
  { code: "NDHS", label: "Health 2024", dot: "bg-emerald-600" },
] as const;

export default function OpenCivicSources() {
  return (
    <section className="mt-20 py-8 border-y border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h4 className="text-label-caps text-text-muted uppercase tracking-wider">
          Open civic sources
        </h4>
        <p className="text-body-sm text-text-secondary mt-0.5">
          Built on official and open data. Every number shows its source and
          date.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
        {SOURCES.map((s) => (
          <div
            key={s.code}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden />
            <span className="text-label-md font-bold text-text-primary">
              {s.code}
            </span>
            <span className="text-[11px] font-label-caps text-text-muted">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
