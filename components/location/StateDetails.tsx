import { useMemo, useState } from "react";
import {
  LENS_IDS,
  LENS_LABELS,
} from "@/lib/lenses/lensHelper";
import {
  getStateOverlayItems,
  type StateOverlayItem,
} from "@/lib/lenses/stateOverlayItems";
import type { CompareBundle } from "@/types/compare";
import type {
  StateContent,
  StateLocation,
  LgaLocation,
  MetroGroup,
  StateNotesMap,
} from "@/types/location";
import { formatStateLandArea } from "@/lib/compare/landArea";
import { getCategoryData } from "@/lib/compare/compareUtils";
import { openCityOnMap } from "@/lib/map/cityCoordsLookup";
import { openStateOverlayItemOnMap } from "@/lib/map/openOverlayItem";
import ShowLgasButton from "@/components/map/ShowLgasButton";
import GetDirectionsButton from "@/components/directions/GetDirectionsButton";
import OverlayItemList from "@/components/location/OverlayItemList";
import { useMapStore } from "@/lib/store/mapStore";

interface StateDetailsProps {
  content: StateContent;
  location: StateLocation;
  lgas: LgaLocation[];
  compareBundle?: CompareBundle;
  selectedLgaId?: string | null;
  onSelectLga?: (id: string) => void;
  metroGroups?: MetroGroup[];
  stateNotesMap?: StateNotesMap;
}

const NOTE_CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
  festival: "bg-pink-50 text-pink-700 border-pink-200",
  institution: "bg-orange-50 text-orange-700 border-orange-200",
};

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

const MONTH_ABBR: Record<string, string> = {
  Jan: "Jan",
  Feb: "Feb",
  Mar: "Mar",
  Apr: "Apr",
  May: "May",
  Jun: "Jun",
  Jul: "Jul",
  Aug: "Aug",
  Sep: "Sep",
  Oct: "Oct",
  Nov: "Nov",
  Dec: "Dec",
};

function formatPeriod(period: {
  frequency?: string;
  months?: string[];
  note?: string;
}): string {
  const freq = period.frequency ? period.frequency : null;
  const months =
    period.months && period.months.length > 0
      ? period.months.map((m) => MONTH_ABBR[m] ?? m).join("/")
      : null;
  if (freq && months) return `${months} · ${freq}`;
  if (freq) return freq;
  if (months) return months;
  return "period";
}

export default function StateDetails({
  content,
  location,
  lgas,
  compareBundle,
  selectedLgaId,
  onSelectLga,
  metroGroups = [],
  stateNotesMap = {},
}: StateDetailsProps) {
  const activeLens = useMapStore((s) => s.activeLens);
  const setActiveLens = useMapStore((s) => s.setActiveLens);
  const openWikiModal = useMapStore((s) => s.openWikiModal);

  const stateLgas = lgas
    .filter((l) => l.parentId === location.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const lgaById = new Map(lgas.map((l) => [l.id, l]));

  const stateMetro = metroGroups.filter((g) => g.stateIds.includes(location.id));
  const stateNotes = stateNotesMap[location.id] ?? [];

  const overlayBundle = useMemo(
    () => getStateOverlayItems(location.id, location.name, activeLens),
    [location.id, location.name, activeLens]
  );

  const touristCount =
    overlayBundle.cities.length +
    overlayBundle.places.length +
    overlayBundle.landforms.length +
    overlayBundle.lakes.length;
  const investCount =
    overlayBundle.resources.length +
    overlayBundle.agriculture.length +
    overlayBundle.cities.length;

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
    openCityOnMap(cityName);
  };

  const onOverlaySelect = (item: StateOverlayItem) => {
    openStateOverlayItemOnMap(item);
  };

  const tabCount =
    activeLens === "learn"
      ? stateNotes.length
      : activeLens === "tourist"
        ? touristCount
        : investCount;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ng-green">
          {content.region}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">{content.name}</h2>
        {nickname && <p className="text-sm text-slate-500 mt-1">{nickname}</p>}
        <p className="text-xs text-slate-600 leading-relaxed">
          {content.description}
        </p>
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
                  className="text-slate-800 underline underline-offset-2 hover:text-ng-green"
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
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Languages spoken ({content.languages.length})
          </h3>
          <div className="text-sm font-semibold text-slate-800 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
            {content.languages.map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => openWikiModal(lang.wikiUrl, lang.name)}
                className="inline-flex items-center gap-1 text-slate-800 underline underline-offset-2 hover:text-ng-green"
                aria-label={`Open Wikipedia article for ${lang.name}`}
                title={`Open Wikipedia: ${lang.name}`}
              >
                {lang.name}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 text-slate-400"
                  aria-hidden
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      <ShowLgasButton stateId={location.id} stateName={location.name} />

      <div className="flex items-center gap-1.5 mb-1" role="tablist" aria-label="Focus lens">
        {LENS_IDS.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={activeLens === l}
            onClick={() => setActiveLens(l)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeLens === l
                ? "bg-ng-green text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-ng-green/40 hover:text-ng-green"
            }`}
          >
            {LENS_LABELS[l]}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-medium text-slate-400">
          {tabCount}{" "}
          {activeLens === "learn" ? "notes" : "places"}
        </span>
      </div>

      {activeLens === "learn" && stateMetro.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Metro areas ({stateMetro.length})
          </h3>
          {stateMetro.map((m) => {
            const metroLgas = m.memberIds
              .map((id) => lgaById.get(id))
              .filter((l): l is LgaLocation => l !== undefined);
            return (
              <div
                key={m.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  {m.memberIds.length > 0 && (
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {m.memberIds.length} LGA
                      {m.memberIds.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                {m.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.description}
                  </p>
                )}
                {metroLgas.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      LGAs in this metro
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {metroLgas.map((lga) => (
                        <button
                          key={lga.id}
                          type="button"
                          onClick={() => onSelectLga?.(lga.id)}
                          title={`Open ${lga.name} details`}
                          className="text-xs text-slate-600 underline underline-offset-2 rounded px-0.5 transition-colors hover:text-ng-green"
                        >
                          {lga.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {m.wikiNotes.length > 0 && (
                  <ul className="space-y-2">
                    {m.wikiNotes.map((w, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-white border border-slate-100 px-2.5 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => openWikiModal(w.url, w.title)}
                          className="w-full text-left group"
                        >
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 group-hover:text-sky-950 underline underline-offset-2">
                            {w.title}
                            <span
                              className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                                NOTE_CATEGORY_STYLES[w.category] ??
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {w.category}
                            </span>
                          </span>
                        </button>
                        <p className="text-[11px] text-slate-500 leading-snug mt-1">
                          {w.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <GetDirectionsButton
        name={content.name}
        lonLat={location.centroid}
        kind="state"
        label="Get directions"
        size="md"
      />

      {activeLens === "learn" && stateNotes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What to explore · learn ({stateNotes.length})
          </h3>
          <ul className="space-y-2">
            {stateNotes.map((n, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => openWikiModal(n.url, n.title)}
                  className="group w-full text-left"
                >
                  <span className="flex items-center flex-wrap gap-1.5 text-sm font-semibold text-slate-800 group-hover:text-ng-green">
                    {n.title}
                    <span
                      className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                        NOTE_CATEGORY_STYLES[n.category] ??
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {n.category}
                    </span>
                  </span>
                </button>

                {(n.period || n.locations || n.type) && (
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-[10px]">
                    {n.type && (
                      <span className="rounded-full bg-slate-50 border border-slate-200 px-1.5 py-px font-semibold uppercase tracking-wide text-slate-500">
                        {n.type}
                      </span>
                    )}
                    {n.period && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-px font-medium text-amber-700">
                        {formatPeriod(n.period)}
                      </span>
                    )}
                    {n.locations &&
                      n.locations.slice(0, 3).map((loc, li) => (
                        <span
                          key={li}
                          className="rounded-full bg-sky-50 border border-sky-200 px-1.5 py-px font-medium text-sky-700"
                        >
                          {loc.name}
                        </span>
                      ))}
                  </div>
                )}

                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  {n.note}
                </p>
                <div className="mt-2">
                  <GetDirectionsButton
                    name={n.title}
                    lonLat={location.centroid}
                    kind="state"
                    label="Get directions"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeLens === "tourist" && (
        <div className="space-y-5">
          {touristCount === 0 ? (
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              No tourist places catalogued for {content.name} yet.
            </p>
          ) : (
            <>
              <OverlayItemList
                title="Cities to visit"
                items={overlayBundle.cities}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
              <OverlayItemList
                title="Places to visit"
                items={overlayBundle.places}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
              <OverlayItemList
                title="Landforms & scenery"
                items={overlayBundle.landforms}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
              <OverlayItemList
                title="Lakes"
                items={overlayBundle.lakes}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
            </>
          )}
        </div>
      )}

      {activeLens === "invest" && (
        <div className="space-y-5">
          {investCount === 0 ? (
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              No investment-related places catalogued for {content.name} yet.
            </p>
          ) : (
            <>
              <OverlayItemList
                title="Resources & minerals"
                items={overlayBundle.resources}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
              <OverlayItemList
                title="Agriculture & land"
                items={overlayBundle.agriculture}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
              <OverlayItemList
                title="Commercial & industrial cities"
                items={overlayBundle.cities}
                onSelect={onOverlaySelect}
                openWikiModal={openWikiModal}
                fallbackLonLat={location.centroid}
              />
            </>
          )}
        </div>
      )}

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
