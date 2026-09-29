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
          <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
            Comprehensive exploration
          </span>
          <h2 className="font-landing-display text-headline-xl text-on-surface">
            Where do you want to start?
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Explore Nigeria through dedicated geopolitical lenses.
          </p>
        </div>
        <Link
          href="/explore"
          className="mt-4 md:mt-0 flex items-center gap-2 text-label-md text-primary"
        >
          <span>Explore all 7 modules</span>
          <IconArrow />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div
          id="civic"
          className="md:col-span-8 rounded-2xl p-8 relative overflow-hidden bg-gradient-to-br from-secondary-container via-surface-container to-surface-container-low border border-primary/30 flex flex-col justify-between group shadow-xl scroll-mt-24"
        >
          <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-primary-container/20 blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-label-caps uppercase tracking-wider">
              Civic &amp; Elections
            </span>
            <span className="text-label-md text-primary-fixed">{puLabel}</span>
          </div>
          <div className="my-8 z-10 max-w-xl">
            <h3 className="font-landing-display text-headline-lg text-on-surface mb-2">
              Find where you vote.
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Locate your Senate district, federal constituency, and polling
              unit. Filter candidates and INEC delimitation data on the map.
            </p>
          </div>
          <div className="z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/30">
            <div className="flex flex-wrap items-center gap-3">
              {["109 Senate Seats", "360 Reps", "774 LGA Councils"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg bg-surface-container-high/90 text-label-md text-on-surface border border-outline-variant/40"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link
              href="/explore?map=election"
              className="inline-flex items-center gap-2 text-label-md text-primary font-bold group-hover:translate-x-1 transition-transform"
            >
              <span>Open electoral map</span>
              <IconArrow />
            </Link>
          </div>
        </div>

        <DoorCard
          id="travel"
          className="md:col-span-4 border-amber-500/30"
          badge="Travel & Heritage"
          badgeClass="bg-amber-500/20 text-amber-300"
          title="Plan a trip."
          body="From Lekki walkways to Obudu and Yankari — verified destinations on the tourist lens."
          stat="120+ DESTINATIONS"
          href="/explore?lens=tourist"
          cta="Explore routes"
          accent="text-amber-400"
        />

        <DoorCard
          id="economy"
          className="md:col-span-4"
          badge="Economy & Trade"
          badgeClass="bg-secondary-container text-secondary"
          title="Find opportunities."
          body="Solid minerals, ports, and power infrastructure on the invest lens."
          stat="INVEST LENS"
          href="/explore?lens=invest"
          cta="View data"
          accent="text-secondary"
        />

        <DoorCard
          id="data"
          className="md:col-span-4 border-tertiary/30"
          badge="Comparative Intelligence"
          badgeClass="bg-tertiary-container/30 text-tertiary"
          title="Compare states."
          body="Benchmark metrics side-by-side with ranking mode and compare tools."
          stat="LIVE RANKINGS"
          href="/explore?map=ranking"
          cta="Compare now"
          accent="text-tertiary"
          sparkline
        />

        <DoorCard
          id="land"
          className="md:col-span-4 scroll-mt-24"
          badge="Terrain & Ecology"
          badgeClass="bg-surface-container-highest text-on-surface-variant"
          title="Explore the land."
          body="Rivers, lakes, landforms, and ecology layers across Nigeria."
          stat="923,768 SQ KM"
          href="/explore"
          cta="Terrain atlas"
          accent="text-primary"
        />

        <div
          id="people"
          className="md:col-span-6 rounded-2xl p-7 bg-surface-container border border-outline-variant/40 flex flex-col justify-between group shadow-lg scroll-mt-24"
        >
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-surface-container-highest text-secondary text-label-caps uppercase">
              Linguistic &amp; Cultural
            </span>
          </div>
          <div className="my-4">
            <h3 className="font-landing-display text-headline-md text-on-surface mb-2">
              Meet the people.
            </h3>
            <p className="text-body-md text-on-surface-variant">
              {culturalGroupCount} major ethnic homelands documented on the map
              with languages, festivals, and cultural context.
            </p>
          </div>
          <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <span className="text-label-caps text-outline">
              {culturalGroupCount} ETHNIC HOMELANDS
            </span>
            <a
              href="#people-spotlight"
              className="inline-flex items-center gap-1 text-label-md text-secondary group-hover:translate-x-1 transition-transform"
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
          badgeClass="bg-surface-container-highest text-primary"
          title="Test yourself."
          body="Geography challenges and civic literacy on the learn lens."
          stat="INTERACTIVE QUIZ"
          href="/explore?lens=learn"
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
      className={`rounded-2xl p-7 bg-surface-container border border-outline-variant/40 flex flex-col justify-between group shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-label-caps uppercase ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div className="my-6">
        <h3 className="font-landing-display text-headline-md text-on-surface mb-2">
          {title}
        </h3>
        <p className="text-body-sm text-on-surface-variant">{body}</p>
        {sparkline && (
          <div className="h-10 mt-3 flex items-end gap-1.5 px-2 py-1 bg-surface-container-lowest/80 rounded-lg border border-outline-variant/30">
            {[3, 6, 5, 9, 7, 4].map((h, i) => (
              <span
                key={i}
                className="w-full bg-tertiary rounded-sm"
                style={{ height: `${h * 4}px`, opacity: 0.4 + i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
        <span className="text-label-caps text-outline">{stat}</span>
        <Link
          href={href}
          className={`inline-flex items-center gap-1 text-label-md ${accent} group-hover:translate-x-1 transition-transform`}
        >
          <span>{cta}</span>
          <IconArrow className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
