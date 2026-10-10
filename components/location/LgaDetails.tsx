"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import type {
  LgaContent,
  LgaLocation,
  LgaGeneral,
  MetroGroup,
} from "@/types/location";
import GetDirectionsButton from "@/components/directions/GetDirectionsButton";
import ViewLgasOnMapButton from "@/components/map/ViewLgasOnMapButton";
import { resolveLgaFocusPlan } from "@/lib/map/lgaMapFocus";
import {
  explorerKickerClass,
  explorerTitleClass,
  explorerChipClass,
  explorerSectionLabelClass,
} from "@/components/location/explorerPanelStyles";

interface LgaDetailsProps {
  content: LgaContent;
  location: LgaLocation;
  regionName?: string;
  wards?: string[];
  general?: LgaGeneral;
  metroGroups?: MetroGroup[];
  lgas?: LgaLocation[];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function ChipList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`${explorerSectionLabelClass} mb-2`}>
        {label} ({items.length})
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={explorerChipClass}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BulletList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`${explorerSectionLabelClass} mb-2`}>
        {label} ({items.length})
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-700 list-disc ml-5">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const NOTE_CATEGORY_STYLES: Record<string, string> = {
  history: "bg-sky-50 text-sky-700 border-sky-200",
  culture: "bg-violet-50 text-violet-700 border-violet-200",
  economy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  geography: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function LgaDetails({
  content,
  location,
  regionName,
  wards = [],
  general,
  metroGroups = [],
  lgas = [],
}: LgaDetailsProps) {
  const setSelectedLga = useMapStore((s) => s.setSelectedLga);
  const openWikiModal = useMapStore((s) => s.openWikiModal);
  const [lon, lat] = location.centroid;
  const wardList = wards.length > 0 ? wards : [];

  const nickname = stringValue(general?.nickname);
  const headquarters = stringValue(general?.headquarters);
  const yearCreated = stringValue(general?.yearCreated);
  const chairman = stringValue(general?.chairman);
  const populationNote = stringValue(general?.populationNote);
  const economy = stringValue(general?.economy);
  const climate = stringValue(general?.climate);
  const summary = stringValue(general?.summary);
  const wikiUrl = stringValue(general?.wikiUrl);
  const majorTowns = general?.majorTowns?.filter(Boolean) ?? [];
  const languages = general?.languages?.filter(Boolean) ?? [];
  const ethnicGroups = general?.ethnicGroups?.filter(Boolean) ?? [];
  const landmarks = general?.landmarks?.filter(Boolean) ?? [];
  const highlights = general?.highlights?.filter(Boolean) ?? [];
  const lgaMetros = metroGroups.filter((g) =>
    g.memberIds.includes(location.id)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={explorerKickerClass}>
            {content.stateName} State · LGA
          </span>
          <h2 className={`${explorerTitleClass} mt-2`}>{content.name}</h2>
          {nickname && <p className="text-sm text-text-muted mt-0.5">{nickname}</p>}
        </div>
        <button
          type="button"
          onClick={() => setSelectedLga(null)}
          className="shrink-0 rounded-lg border border-border-subtle px-2.5 py-1 text-xs font-medium text-text-muted hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close LGA details"
        >
          Close
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <dt className="text-text-muted">State</dt>
        <dd className="font-medium">{content.stateName}</dd>
        <dt className="text-text-muted">Land area</dt>
        <dd className="font-medium">
          {location.areaKm2 != null
            ? `${location.areaKm2.toLocaleString()} km²`
            : content.areaKm2 != null
              ? `${content.areaKm2.toLocaleString()} km²`
              : "—"}
        </dd>
        <dt className="text-text-muted">Wards</dt>
        <dd className="font-medium">{wardList.length || content.wardCount || "—"}</dd>
        <dt className="text-text-muted">Region</dt>
        <dd className="font-medium">{regionName ?? location.regionId}</dd>
        {headquarters && (
          <>
            <dt className="text-text-muted">Headquarters</dt>
            <dd className="font-medium">{headquarters}</dd>
          </>
        )}
        {yearCreated && (
          <>
            <dt className="text-text-muted">Created</dt>
            <dd className="font-medium">{yearCreated}</dd>
          </>
        )}
        {chairman && (
          <>
            <dt className="text-text-muted">Council chairman</dt>
            <dd className="font-medium">{chairman}</dd>
          </>
        )}
        {populationNote && (
          <>
            <dt className="text-text-muted">Population</dt>
            <dd className="font-medium">{populationNote}</dd>
          </>
        )}
        <dt className="text-text-muted">Code</dt>
        <dd className="font-mono text-xs font-medium text-slate-700">
          {location.id}
        </dd>
        <dt className="text-text-muted">Centroid</dt>
        <dd className="font-mono text-xs text-text-secondary">
          {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </dd>
      </dl>

      <GetDirectionsButton
        name={content.name}
        lonLat={location.centroid}
        kind="lga"
        label="Get directions"
        size="md"
      />

      <p className="text-sm text-text-secondary leading-relaxed">
        {summary ?? content.description}
      </p>

      {lgaMetros.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Metro area{lgaMetros.length === 1 ? "" : "s"} (
            {lgaMetros.length})
          </h3>
          {lgaMetros.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-100 bg-emerald-50/40 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {m.name}
                </p>
                <ViewLgasOnMapButton
                  plan={resolveLgaFocusPlan(m.memberIds, lgas, m.stateIds, {
                    id: m.id,
                    label: m.name,
                  })}
                  className="shrink-0"
                />
              </div>
              {m.memberIds.length > 0 && (
                <p className="text-[11px] font-medium text-text-muted">
                  {m.memberIds.length} LGA
                  {m.memberIds.length === 1 ? "" : "s"} in this metro
                </p>
              )}
              {m.description && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {m.description}
                </p>
              )}
              {m.wikiNotes.length > 0 && (
                <ul className="space-y-2 pt-0.5">
                  {m.wikiNotes.map((w, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-surface-card border border-slate-100 px-2.5 py-2"
                    >
                      {w.url ? (
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
                                "bg-slate-50 text-text-secondary border-border-subtle"
                              }`}
                            >
                              {w.category}
                            </span>
                          </span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          {w.title}
                          <span
                            className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                              NOTE_CATEGORY_STYLES[w.category] ??
                              "bg-slate-50 text-text-secondary border-border-subtle"
                            }`}
                          >
                            {w.category}
                          </span>
                        </span>
                      )}
                      <p className="text-xs text-text-muted leading-relaxed mt-1">
                        {w.note}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {economy && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Economy
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">{economy}</p>
        </div>
      )}

      {climate && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Climate
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">{climate}</p>
        </div>
      )}

      <ChipList label="Languages" items={languages} />
      <ChipList label="Ethnic groups" items={ethnicGroups} />
      <ChipList label="Major towns" items={majorTowns} />
      <ChipList label="Landmarks" items={landmarks} />
      <BulletList label="Highlights" items={highlights} />

      {wikiUrl && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 mb-1">
            Deeper reading
          </p>
          <p className="text-xs text-text-secondary mb-2">
            Wikipedia has longer history, demographics, and references than this
            card.
          </p>
          <button
            type="button"
            onClick={() => openWikiModal(wikiUrl, content.name)}
            className="inline-flex text-sm font-medium text-sky-800 hover:text-sky-950 underline underline-offset-2"
          >
            Deep dive
          </button>
        </div>
      )}

      {wardList.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Wards ({wardList.length})
          </h3>
          <ul className="overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
            {wardList.map((ward) => (
              <li
                key={ward}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {ward}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}