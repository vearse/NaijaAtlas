import Link from "next/link";

const FEATURES = [
  {
    title: "Six default tickets",
    body: "AAC, ADC, APC, APM, NDC, and PDP — expand any ticket or open the full INEC list.",
  },
  {
    title: "Set turnout and shares",
    body: "Start from each state's recent turnout and 2023 vote shares, then adjust.",
  },
  {
    title: "Share the scenario",
    body: "The map and every state assumption are encoded in a shareable link.",
  },
];

export default function PresidentialSpeculationCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="max-w-xl">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            Presidential only
          </span>
          <h3 className="mt-3 text-xl font-bold text-text-primary md:text-2xl">
            Build a what-if national result
          </h3>
          <p className="mt-2 text-body-sm text-text-secondary">
            Project valid votes from the current 2023 register of{" "}
            <span className="font-semibold text-text-primary">93,469,008</span>{" "}
            voters. Turnout defaults come from the 2019 and 2023 presidential
            elections, and unset states can fall back to their 2023 result.
          </p>
          <Link
            href="/civic/map/elections?mode=speculate"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary"
          >
            Open speculation map
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="grid gap-2 md:w-[min(100%,340px)]">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-xl border border-border-subtle bg-slate-50/70 p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {feature.title}
                </p>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
