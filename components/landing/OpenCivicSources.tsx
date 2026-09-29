const SOURCES = [
  { code: "INEC", label: "Elections", dot: "bg-primary" },
  { code: "NBS", label: "Statistics", dot: "bg-secondary" },
  { code: "NPC", label: "Population", dot: "bg-tertiary" },
  { code: "UN SALB", label: "Boundaries", dot: "bg-outline" },
  { code: "NDHS", label: "Health 2024", dot: "bg-outline" },
] as const;

export default function OpenCivicSources() {
  return (
    <section className="mt-20 py-8 border-y border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h4 className="text-label-caps text-outline uppercase tracking-wider">
          Open civic sources
        </h4>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Built on official and open data. Every number shows its source and
          date.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 opacity-80 hover:opacity-100 transition-opacity">
        {SOURCES.map((s) => (
          <div
            key={s.code}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40"
          >
            <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden />
            <span className="text-label-md font-bold text-on-surface">
              {s.code}
            </span>
            <span className="text-[11px] font-label-caps text-outline">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
