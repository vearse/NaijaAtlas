import Link from "next/link";
import { IconArrow } from "@/components/landing/icons";
import type { EthnicSpotlightCard } from "@/lib/landing/ethnicGroupTypes";

type Props = {
  spotlight: EthnicSpotlightCard[];
  totalCount: number;
};

export default function PeopleSpotlight({ spotlight, totalCount }: Props) {
  return (
    <section className="mt-28 scroll-mt-24" id="people-spotlight">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-label-caps text-secondary tracking-widest uppercase block mb-1">
            Indigenous civilizations
          </span>
          <h2 className="font-landing-display text-headline-xl text-on-surface">
            Meet the people.
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Homelands, languages, and traditional arts spanning {totalCount}{" "}
            documented ethnic identities.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-label-md text-primary font-semibold hover:underline shrink-0"
        >
          <span>Explore all {totalCount} ethnic groups</span>
          <IconArrow />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {spotlight.map((card) => (
          <Link
            key={card.id}
            href={card.exploreHref}
            className="landing-glass-card rounded-2xl p-6 flex flex-col justify-between group"
          >
            <div>
              <div
                className="h-28 w-full rounded-xl mb-4 overflow-hidden border border-outline-variant/40 bg-surface-container relative"
              >
                <div
                  className={`absolute inset-0 ${card.overlayClass} z-10`}
                />
                <div
                  className={`absolute inset-0 z-20 flex flex-col justify-end p-3 bg-gradient-to-r ${card.gradientClass} opacity-60`}
                />
                <div className="absolute inset-0 z-30 flex flex-col justify-end p-3">
                  <span
                    className={`text-label-caps ${card.motifAccentClass}`}
                  >
                    {card.motifLabel}
                  </span>
                  <span className="font-landing-display text-headline-sm text-white font-bold">
                    {card.name}
                  </span>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {card.description}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-outline-variant/30 flex items-center justify-between text-body-sm">
              <span className="text-outline">
                {card.homelandLgaCount} Homeland LGAs
              </span>
              <span className="text-primary font-semibold">
                {card.zonesLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
