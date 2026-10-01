import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref } from "@/lib/navigation/sectionMaps";
import type { LandHubData } from "@/lib/server/loadLandHubData";

/** Earth tones per zone so the hero reads as land, not as a data choropleth. */
const ZONE_FILL: Record<string, string> = {
  "NG-NW": "#d9b779",
  "NG-NE": "#c9a26a",
  "NG-NC": "#9cb86b",
  "NG-SW": "#6fa36a",
  "NG-SE": "#4e8f5f",
  "NG-SS": "#2f7d6b",
};

const BANDS = [
  {
    title: "The dry north",
    body: "Sudan and Sahel savanna running up to the Lake Chad basin, broken by granite inselbergs and the Sokoto plains.",
  },
  {
    title: "The middle belt",
    body: "The Jos Plateau and the wide Niger–Benue trough, where the two great rivers meet at Lokoja.",
  },
  {
    title: "The wet south",
    body: "Rainforest, the eastern highlands along Cameroon, and the Niger Delta's creeks and mangroves meeting the Atlantic.",
  },
];

export default function LandHero({ regions }: { regions: LandHubData["regions"] }) {
  return (
    <section id="overview" className="scroll-mt-32 pt-10 md:pt-14">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-label-caps text-lime-800">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-600" />
            NIGERIA OVERVIEW · LAND
          </span>
          <h1 className="mt-5 font-landing-display text-headline-xl-mobile tracking-tight text-text-primary md:text-display-hero">
            Nigeria, from the Sahel to the sea.
          </h1>
          <p className="mt-4 max-w-xl text-body-lg text-text-secondary">
            The Federal Republic of Nigeria is 36 states and the Federal Capital
            Territory, grouped into six geopolitical zones. Its land climbs from
            the Atlantic coast through rainforest and plateau to the dry
            savanna of the far north.
          </p>

          <ul className="mt-6 space-y-3">
            {BANDS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-container" aria-hidden />
                <p className="text-body-md text-text-secondary">
                  <span className="font-semibold text-text-primary">{b.title}. </span>
                  {b.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#terrain"
              className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 text-label-md font-semibold text-white hover:bg-[#006d40]"
            >
              Explore the land
            </a>
            <Link
              href={sectionMapHref("land/physical")}
              className="inline-flex h-11 items-center rounded-xl border border-primary-container px-5 text-label-md font-semibold text-primary hover:bg-emerald-50"
            >
              Open the terrain map
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-sm md:p-6">
          <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-white px-2 py-4">
            <NigeriaThumb
              source="regions"
              fillByKey={ZONE_FILL}
              className="mx-auto h-80 w-full md:h-[26rem]"
              title="Nigeria's six geopolitical zones"
            />
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {regions.map((r) => (
              <li key={r.id}>
                <Link
                  href={sectionMapHref("land/zones", { regionId: r.id })}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-text-secondary hover:bg-slate-50 hover:text-primary"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: ZONE_FILL[r.id] ?? "#cbd5e1" }}
                    aria-hidden
                  />
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
