import Link from "next/link";
import { IconArrow } from "@/components/landing/icons";
import { formatCompactNumber } from "@/lib/format/compactNumber";

type Props = {
  totalPollingUnits: number;
  culturalGroupCount: number;
};

export default function SectionDoorsGrid({
  totalPollingUnits,
  culturalGroupCount,
}: Props) {
  const puLabel = `${formatCompactNumber(totalPollingUnits)} Polling Units Loaded`;

  return (
    <section className="mt-24" id="doors-section">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
          <span className="text-label-caps text-primary uppercase block mb-1">
            Comprehensive exploration
          </span>
          <h2 className="font-landing-display text-headline-xl text-text-primary font-extrabold">
            Where do you want to start?
          </h2>
          <p className="text-body-md text-text-secondary mt-1">
            Explore Nigeria through dedicated geopolitical lenses.
          </p>
        </div>
        <Link
          href="#geopolitical-directory"
          className="mt-4 md:mt-0 flex items-center gap-2 text-label-md text-primary font-semibold hover:underline"
        >
          <span>Jump to the state directory</span>
          <IconArrow />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div
          id="civic"
          className="md:col-span-8 rounded-2xl p-8 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-200 flex flex-col justify-between group shadow-md scroll-mt-24"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-primary-container text-white text-label-caps uppercase tracking-wider">
              Civic &amp; Elections
            </span>
            <span className="text-label-md text-emerald-800">{puLabel}</span>
          </div>
          <div className="my-8 z-10 max-w-xl">
            <h3 className="font-landing-display text-headline-lg text-text-primary mb-2 font-bold">
              Find where you vote.
            </h3>
            <p className="text-body-md text-text-secondary">
              Locate your Senate district, federal constituency, and polling
              unit. Filter candidates and INEC delimitation data on the map.
            </p>
          </div>
          <div className="z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <div className="flex flex-wrap items-center gap-3">
              {["109 Senate Seats", "360 Reps", "774 LGA Councils"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg bg-surface-card text-label-md text-slate-700 border border-border-subtle"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link
              href="/civic/map/elections"
              className="inline-flex items-center gap-2 text-label-md text-primary font-bold group-hover:translate-x-1 transition-transform"
            >
              <span>Open election map</span>
              <IconArrow />
            </Link>
          </div>
        </div>

        <DoorCard
          id="travel"
          className="md:col-span-4 border-amber-200"
          badge="Travel & Heritage"
          badgeClass="bg-amber-50 text-amber-800 border border-amber-200"
          title="Plan a trip."
          body="From Lekki walkways to Obudu and Yankari — verified destinations on the tourist lens."
          stat="120+ DESTINATIONS"
          href="/travel/map"
          cta="Explore routes"
          accent="text-amber-700"
        />

        <DoorCard
          id="economy"
          className="md:col-span-4"
          badge="Economy & Trade"
          badgeClass="bg-teal-50 text-teal-800 border border-teal-200"
          title="Find opportunities."
          body="Solid minerals, ports, and power infrastructure on the invest lens."
          stat="INVEST LENS"
          href="/economy/map"
          cta="View data"
          accent="text-teal-700"
        />

        <DoorCard
          id="data"
          className="md:col-span-4 border-cyan-200"
          badge="Comparative Intelligence"
          badgeClass="bg-cyan-50 text-cyan-800 border border-cyan-200"
          title="Compare states."
          body="Benchmark metrics side-by-side with ranking mode and compare tools."
          stat="LIVE RANKINGS"
          href="/data/map/rankings"
          cta="Rankings map"
          accent="text-cyan-700"
          sparkline
        />

        <DoorCard
          id="land"
          className="md:col-span-4 scroll-mt-24"
          badge="Terrain & Ecology"
          badgeClass="bg-slate-100 text-slate-700 border border-slate-200"
          title="Explore the land."
          body="Rivers, lakes, landforms, and ecology layers across Nigeria."
          stat="923,768 SQ KM"
          href="/places#land"
          cta="Places & land"
          accent="text-primary"
        />

        <div
          id="people"
          className="md:col-span-6 rounded-2xl p-7 bg-surface-card border border-border-subtle flex flex-col justify-between group shadow-sm scroll-mt-24"
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-label-caps uppercase">
              Linguistic &amp; Cultural
            </span>
          </div>
          <div className="my-4">
            <h3 className="font-landing-display text-headline-md text-text-primary mb-2 font-bold">
              Meet the people.
            </h3>
            <p className="text-body-md text-text-secondary">
              {culturalGroupCount} major ethnic homelands documented on the map
              with languages, festivals, and cultural context.
            </p>
          </div>
          <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
            <span className="text-label-caps text-text-muted">
              {culturalGroupCount} ETHNIC HOMELANDS
            </span>
            <a
              href="#people-spotlight"
              className="inline-flex items-center gap-1 text-label-md text-emerald-800 group-hover:translate-x-1 transition-transform"
            >
              <span>View people mosaic</span>
              <IconArrow />
            </a>
          </div>
        </div>

        <DoorCard
          id="learn"
          className="md:col-span-6 scroll-mt-24"
          badge="Civic Literacy"
          badgeClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
          title="Test yourself."
          body="Geography challenges and civic literacy on the learn lens."
          stat="INTERACTIVE QUIZ"
          href="/places/map"
          cta='Play "Find the State"'
          accent="text-primary"
        />
      </div>
    </section>
  );
}

function DoorCard({
  id,
  className = "",
  badge,
  badgeClass,
  title,
  body,
  stat,
  href,
  cta,
  accent,
  sparkline,
}: {
  id: string;
  className?: string;
  badge: string;
  badgeClass: string;
  title: string;
  body: string;
  stat: string;
  href: string;
  cta: string;
  accent: string;
  sparkline?: boolean;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl p-7 bg-surface-card border border-border-subtle flex flex-col justify-between group shadow-sm landing-light-card ${className}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-label-caps uppercase ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div className="my-6">
        <h3 className="font-landing-display text-headline-md text-text-primary mb-2 font-bold">
          {title}
        </h3>
        <p className="text-body-sm text-text-secondary">{body}</p>
        {sparkline && (
          <div className="h-10 mt-3 flex items-end gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-border-subtle">
            {[3, 6, 5, 9, 7, 4].map((h, i) => (
              <span
                key={i}
                className="w-full bg-cyan-500 rounded-sm"
                style={{ height: `${h * 4}px`, opacity: 0.35 + i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
        <span className="text-label-caps text-text-muted">{stat}</span>
        <Link
          href={href}
          className={`inline-flex items-center gap-1 text-label-md font-semibold ${accent} group-hover:translate-x-1 transition-transform`}
        >
          <span>{cta}</span>
          <IconArrow className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
