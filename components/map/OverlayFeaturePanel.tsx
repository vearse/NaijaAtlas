"use client";

import type { ReactNode } from "react";
import { useMapStore } from "@/lib/store/mapStore";
import {
  CITY_CATEGORY_LABELS,
  OVERLAY_LAYER_LABELS,
  type CityCategory,
  type SelectedOverlayFeature,
} from "@/types/overlay";
import type { StateLocation } from "@/types/location";

interface OverlayFeaturePanelProps {
  feature: SelectedOverlayFeature;
  states: StateLocation[];
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function text(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="text-sm text-slate-700 mt-0.5 leading-relaxed">{value}</dd>
    </div>
  );
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-700 leading-relaxed pl-3 relative">
            <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function cityCategoryMeta(value: unknown) {
  if (typeof value !== "string") return null;
  return CITY_CATEGORY_LABELS[value as CityCategory] ?? null;
}

export default function OverlayFeaturePanel({
  feature,
  states,
}: OverlayFeaturePanelProps) {
  const { clearSelectedOverlay, showLgas, addSelectedState } = useMapStore();
  const { layerId, name, properties: props } = feature;
  const meta = OVERLAY_LAYER_LABELS[layerId];
  const cityCat = cityCategoryMeta(props.category);

  const relatedStateNames = [
    ...parseStringArray(props.statesCrossed),
    ...parseStringArray(props.coastalStates),
  ];
  if (typeof props.stateName === "string" && props.stateName) {
    relatedStateNames.push(props.stateName);
  }
  const uniqueStateNames = [...new Set(relatedStateNames)];

  const relatedStates = uniqueStateNames
    .map((stateName) => states.find((s) => s.name === stateName))
    .filter((s): s is StateLocation => s != null);

  const unmatchedStateNames = uniqueStateNames.filter(
    (stateName) => !relatedStates.some((s) => s.name === stateName)
  );

  const wikiUrl = text(props.wikiUrl);
  const lengthKm =
    typeof props.lengthKm === "number"
      ? `${props.lengthKm.toLocaleString()} km`
      : text(props.lengthKm);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {meta.label} layer
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
          {text(props.nickname) && (
            <p className="text-sm text-slate-500 mt-1">{text(props.nickname)}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cityCat && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: cityCat.color }}
              >
                {cityCat.label}
              </span>
            )}
            {text(props.type) && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {text(props.type)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearSelectedOverlay()}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close overlay details"
        >
          Close
        </button>
      </div>

      {text(props.summary) && (
        <p className="text-sm text-slate-600 leading-relaxed">{text(props.summary)}</p>
      )}

      {text(props.description) && (
        <p className="text-sm text-slate-700 leading-relaxed">{text(props.description)}</p>
      )}

      <dl className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <DetailRow label="Founded" value={text(props.founded)} />
        <DetailRow label="Length" value={lengthKm} />
        <DetailRow label="Course in Nigeria" value={text(props.lengthNote)} />
        <DetailRow label="Source" value={text(props.sourceNote)} />
        <DetailRow label="Mouth / outlet" value={text(props.mouthNote)} />
        <DetailRow label="Area" value={text(props.areaNote)} />
        <DetailRow label="Population" value={text(props.populationNote)} />
        <DetailRow label="Elevation" value={text(props.elevationNote)} />
        <DetailRow label="Climate" value={text(props.climate)} />
        <DetailRow label="Economy" value={text(props.economy)} />
        <DetailRow label="Ecology" value={text(props.ecology)} />
        <DetailRow label="Usage" value={text(props.usage)} />
        <DetailRow label="Landscape" value={text(props.character)} />
        <DetailRow label="Significance" value={text(props.significance)} />
      </dl>

      <BulletList label="Highlights" items={parseStringArray(props.highlights)} />
      <ChipList label="Landmarks" items={parseStringArray(props.landmarks)} />
      <ChipList label="Tributaries" items={parseStringArray(props.tributaries)} />

      {(relatedStates.length > 0 || unmatchedStateNames.length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Related states
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedStates.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => {
                  addSelectedState(state.id);
                  showLgas(state.id);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-ng-green/40 hover:bg-emerald-50 transition-colors"
              >
                {state.name}
              </button>
            ))}
            {unmatchedStateNames.map((stateName) => (
              <span
                key={stateName}
                className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
              >
                {stateName}
              </span>
            ))}
          </div>
        </div>
      )}

      {wikiUrl && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 mb-1">
            Deeper reading
          </p>
          <p className="text-xs text-slate-600 mb-2">
            Wikipedia has longer history, demographics, and references than this map card.
          </p>
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-sky-800 hover:text-sky-950 underline underline-offset-2"
          >
            Open Wikipedia
          </a>
        </div>
      )}
    </div>
  );
}
