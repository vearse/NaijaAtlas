import Link from "next/link";
import NigeriaThumb from "@/components/hub/NigeriaThumb";
import { sectionMapHref, SECTION_MAPS, type SectionMapHrefOptions, type SectionMapId } from "@/lib/navigation/sectionMaps";

type Props = {
  map: SectionMapId;
  /** Badge above the title, e.g. "176,846 polling units". */
  kicker?: string;
  hrefOptions?: SectionMapHrefOptions;
  className?: string;
};

/**
 * Map workspace card. Hubs never load MapLibre — the illustration is a static
 * SVG projection of the same GeoJSON the atlas uses, and the CTA hands off to
 * the focused map workspace.
 */
export default function MapWorkspaceCard({
  map,
  kicker,
  hrefOptions,
  className = "",
}: Props) {
  const meta = SECTION_MAPS[map];
  const href = sectionMapHref(map, hrefOptions);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm ${className}`}
    >
      <div className="relative h-40 bg-slate-50 px-6 pt-4">
        <NigeriaThumb
          source={meta.thumb.source}
          highlight={meta.thumb.highlight}
          className="h-full w-full"
          title={meta.title}
        />
        {kicker && (
          <span className="absolute left-4 top-4 rounded-full border border-border-subtle bg-surface-card/90 px-2.5 py-1 text-[11px] font-semibold text-text-secondary backdrop-blur">
            {kicker}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t border-slate-100 p-6">
        <div>
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            {meta.title}
          </h3>
          <p className="mt-2 text-body-sm text-text-secondary">{meta.blurb}</p>
        </div>
        <div className="mt-auto">
          <Link
            href={href}
            className={`inline-flex h-11 items-center rounded-xl px-5 text-label-md ${
              meta.variant === "primary"
                ? "bg-primary-container text-white hover:bg-[#006d40]"
                : "border border-primary-container text-primary hover:bg-emerald-50"
            }`}
          >
            {meta.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
