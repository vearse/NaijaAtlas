import { useState } from "react";
import type { CompareBundle } from "@/types/compare";
import type { StateContent, StateLocation, LgaLocation } from "@/types/location";
import { formatStateLandArea } from "@/lib/compare/landArea";
import { getCategoryData } from "@/lib/compare/compareUtils";
import { buildCityOverlayFeature } from "@/lib/map/cityCoordsLookup";
import ShowLgasButton from "@/components/map/ShowLgasButton";
import VisitDirectionsControl from "@/components/directions/VisitDirectionsControl";
import { useMapStore } from "@/lib/store/mapStore";

interface StateDetailsProps {
  content: StateContent;
  location: StateLocation;
  lgas: LgaLocation[];
  compareBundle?: CompareBundle;
  selectedLgaId?: string | null;
  onSelectLga?: (id: string) => void;
}

function StatCard({
  label,
  value,
  span = false,
  accent = false,
}: {
  label: string;
  value: string;
  span?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 ${
        span ? "col-span-2" : ""
      }`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd
        className={`${
          accent
            ? "text-lg font-bold text-ng-green"
            : "text-sm font-semibold text-slate-800"
        } mt-0.5`}
      >
        {value}
      </dd>
    </div>
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function StateDetails({
  content,
  location,
  lgas,
  compareBundle,
  selectedLgaId,
  onSelectLga,
}: StateDetailsProps) {
  const [showPlanVisit, setShowPlanVisit] = useState(false);
  const openWikiModal = useMapStore((s) => s.openWikiModal);

  const stateLgas = lgas
    .filter((l) => l.parentId === location.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const wardTotal = stateLgas.reduce((n, l) => n + l.wardCount, 0);
  const landArea = formatStateLandArea(compareBundle, location.id);

  const general = compareBundle
    ? (getCategoryData(compareBundle, "state", "general", "default")[
        location.id
      ] ?? {})
    : {};

  const capital =
    stringValue(general.capital) ?? content.capital ?? "—";
  const founded = stringValue(general.yearCreated) ?? "—";
  const nickname = stringValue(general.nickname);
  const majorCitiesRaw = stringValue(general.majorCities);
  const majorCityList = majorCitiesRaw
    ? majorCitiesRaw
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const openMajorCity = (cityName: string) => {
    const store = useMapStore.getState();
    const feature = buildCityOverlayFeature(cityName);
    if (!feature) return;
    if (!store.activeOverlays.has("cities")) store.toggleOverlay("cities");
    store.setSelectedOverlay(feature);
    const map = store.mapInstance;
    const coords =
      feature.geometry?.type === "Point"
        ? (feature.geometry.coordinates as [number, number])
        : null;
    if (map && coords) {
      map.flyTo({
        center: coords,
        zoom: Math.max(map.getZoom() ?? 5, 7),
        speed: 0.9,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ng-green">
          {content.region}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">{content.name}</h2>
        {nickname && <p className="text-sm text-slate-500 mt-1">{nickname}</p>}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <StatCard label="Land area" value={landArea} span accent />
        <StatCard label="Capital" value={capital} />
        <StatCard label="Region" value={location.regionName} />
        <StatCard label="Founded" value={founded} />
        <StatCard label="LGAs" value={String(content.lgaCount)} />
        {majorCityList.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Major cities
            </dt>
            <dd className="text-sm font-semibold text-slate-800 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
              {majorCityList.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => openMajorCity(city)}
                  className="text-ng-green underline underline-offset-2 hover:text-emerald-700"
                >
                  {city}
                </button>
              ))}
            </dd>
          </div>
        )}
        <StatCard
          label="Wards"
          value={wardTotal > 0 ? String(wardTotal) : "—"}
        />
      </dl>

      {content.languages && content.languages.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Languages spoken ({content.languages.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {content.languages.map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => openWikiModal(lang.wikiUrl, lang.name)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 text-xs font-medium px-3 py-1.5 transition-colors"
                aria-label={`Open Wikipedia article for ${lang.name}`}
                title={`Open Wikipedia: ${lang.name}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <span>{lang.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 text-emerald-500"
                  aria-hidden
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </button>
            ))}
          </div>
          {/* <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Tap any language above to open a deep-dive Wikipedia reader with
            background, speaker populations, and linguistic context.
          </p> */}
        </div>
      )}

      <ShowLgasButton stateId={location.id} stateName={location.name} />

      <button
        type="button"
        onClick={() => setShowPlanVisit((v) => !v)}
        aria-expanded={showPlanVisit}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
          showPlanVisit
            ? "border-ng-green/40 bg-emerald-50 text-ng-green"
            : "border-slate-200 bg-white text-slate-600 hover:border-ng-green/40 hover:text-ng-green",
        ].join(" ")}
      >
        <span aria-hidden>🧭</span>
        {showPlanVisit ? "Hide plan visit" : "Show plan visit"}
      </button>

      {showPlanVisit && (
        <VisitDirectionsControl
          feature={{
            name: content.name,
            lonLat: location.centroid,
            kind: "state",
          }}
        />
      )}

      {/* <p className="text-xs text-slate-500 text-center leading-relaxed">
        Double-click {location.name} on the map to show LGAs, or use the button
        above.
      </p> */}

      <p className="text-sm text-slate-600 leading-relaxed">
        {content.description}
      </p>

      {stateLgas.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Local government areas ({stateLgas.length})
          </h3>
          <ul className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
            {stateLgas.map((lga) => (
              <li key={lga.id}>
                <button
                  type="button"
                  onClick={() => onSelectLga?.(lga.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-50 ${
                    selectedLgaId === lga.id
                      ? "bg-emerald-50 font-semibold text-ng-green"
                      : "text-slate-700"
                  }`}
                >
                  <span>{lga.name}</span>
                  {lga.wardCount > 0 && (
                    <span className="text-xs text-slate-400 ml-2">
                      {lga.wardCount} wards
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}