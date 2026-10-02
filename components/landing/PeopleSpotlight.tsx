import Image from "next/image";
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
          <span className="text-label-caps text-primary uppercase block mb-1">
            Indigenous civilizations
          </span>
          <h2 className="font-landing-display text-headline-xl text-text-primary font-extrabold">
            Meet the people.
          </h2>
          <p className="text-body-md text-text-secondary mt-1">
            Homelands, languages, and traditional arts spanning {totalCount}{" "}
            documented ethnic identities.
          </p>
        </div>
        <Link
          href="/people"
          className="inline-flex items-center gap-2 text-label-md text-primary font-bold hover:underline shrink-0"
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
            className="landing-light-card rounded-2xl p-6 flex flex-col justify-between group bg-surface-card"
          >
            <div>
              <div className="h-28 w-full rounded-xl mb-4 overflow-hidden border border-border-subtle bg-slate-100 relative">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={`${card.motifLabel.toLowerCase()} — ${card.name} cultural motif`}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 92vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 ${card.overlayClass}`}
                  />
                )}
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
              <p className="text-body-sm text-text-secondary">
                {card.description}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-body-sm">
              <span className="text-text-muted font-medium">                {card.homelandLgaCount} Homeland LGAs
              </span>
              <span className="text-primary font-bold">
                {card.zonesLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
