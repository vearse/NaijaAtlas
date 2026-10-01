import Link from "next/link";
import type { HubPlace } from "@/lib/server/loadTravelHubData";
import { IconArrow, IconChevronRight } from "@/components/landing/icons";

type Props = {
  destinations: HubPlace[];
  activeId: string;
  onSelect: (id: string) => void;
};

const CATEGORY_TAG: Record<string, string> = {
  "national-park": "Park",
  "wildlife-reserve": "Wildlife",
  waterfall: "Waterfall",
  "natural-wonder": "Natural",
  mountain: "Highland",
  "rock-formation": "Formation",
  cave: "Cave",
  beach: "Coast",
  lake: "Lake",
  resort: "Resort",
  "heritage-site": "Heritage",
  monument: "Monument",
  museum: "Museum",
  dam: "Dam",
  bridge: "Landmark",
  stadium: "Venue",
  airport: "Airport",
  market: "Market",
  "religious-site": "Sacred",
};

const ACCENT_TAG: Record<string, string> = {
  mountain: "text-heritage-amber",
  "heritage-site": "text-heritage-amber",
  monument: "text-heritage-amber",
};

function tagFor(category: string) {
  return CATEGORY_TAG[category] ?? category.split("-").pop() ?? "Place";
}

export default function TopDestinations({ destinations, activeId, onSelect }: Props) {
  const cards = destinations.slice(0, 6);
  if (cards.length === 0) return null;
  const active = cards.find((d) => d.id === activeId) ?? cards[0];

  return (
    <section className="space-y-6" id="destinations">
      <div>
        <h2 className="font-landing-display text-headline-lg tracking-tight text-text-primary">
          Top destinations
        </h2>
        <p className="text-body-md text-text-secondary">
          Hand-curated ecological and cultural landmarks verified by local guides.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          {cards.map((place) => {
            const isActive = place.id === active.id;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect(place.id)}
                aria-pressed={isActive}
                className={`flex flex-col justify-between rounded-xl p-4 text-left shadow-sm transition-all ${
                  isActive
                    ? "relative border-2 border-primary bg-primary-tint-light"
                    : "border border-border-subtle bg-surface-card hover:border-slate-300"
                }`}
              >
                {isActive ? (
                  <span className="absolute -top-3 right-4 rounded-full bg-primary-container px-2.5 py-0.5 font-label-caps text-label-caps uppercase tracking-wider text-white shadow-xs">
                    Active selection
                  </span>
                ) : null}

                <div>
                  <span
                    className={`mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
                      isActive
                        ? "bg-surface-card/90 text-heritage-amber"
                        : `bg-surface-card/90 ${
                            ACCENT_TAG[place.category] ?? "text-text-primary"
                          }`
                    }`}
                  >
                    {tagFor(place.category)}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">
                    {place.name}
                  </h3>
                  <p className="text-body-sm text-text-secondary">
                    {place.summary}
                  </p>
                </div>

                <div
                  className={`mt-4 flex items-center justify-between border-t pt-3 ${
                    isActive ? "border-primary/20" : "border-border-subtle"
                  }`}
                >
                  <span
                    className={`font-label-caps text-label-caps ${
                      isActive
                        ? "font-bold text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {place.stateName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-label-md text-label-md ${
                      isActive ? "text-primary" : "text-primary"
                    }`}
                  >
                    View guide
                    <IconChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-md lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-label-caps text-label-caps uppercase tracking-wider text-text-muted">
                  Selected destination
                </p>
                <h3 className="mt-1 font-headline-sm text-headline-sm font-bold text-text-primary">
                  {active.name}
                </h3>
              </div>
              <span className="shrink-0 rounded-full border border-primary/20 bg-primary-tint-light px-2.5 py-1 font-label-caps text-label-caps text-primary">
                {active.stateName}
              </span>
            </div>

            <dl className="mt-5 space-y-3 text-body-sm">
              <Detail term="Category" value={tagFor(active.category)} />
              <Detail term="Region" value={active.stateName} />
              <Detail
                term="Coordinates"
                value={
                  active.lon !== null && active.lat !== null
                    ? `${active.lat.toFixed(3)}°, ${active.lon.toFixed(3)}°`
                    : "Not geocoded"
                }
              />
              <Detail term="Climate" value={active.note || "Not recorded"} />
            </dl>

            {active.highlights.length > 0 ? (
              <div className="mt-5 border-t border-border-subtle pt-4">
                <p className="font-label-caps text-label-caps uppercase text-text-muted">
                  Highlights
                </p>
                <ul className="mt-2 space-y-1.5">
                  {active.highlights.slice(0, 4).map((h) => (
                    <li key={h} className="flex gap-2 text-body-sm text-text-secondary">
                      <span className="text-primary" aria-hidden>
                        ✓
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {active.slug ? (
                <Link
                  href={`/places/${active.slug}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 font-label-md text-label-md text-white shadow-sm transition-colors hover:bg-primary"
                >
                  Open {active.stateName} profile
                  <IconArrow className="w-4 h-4" />
                </Link>
              ) : null}
              <Link
                href="/explore?map=minimal"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-5 font-label-md text-label-md text-text-secondary transition-colors hover:bg-slate-50 hover:text-text-primary"
              >
                Locate on map
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-text-muted">{term}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
}