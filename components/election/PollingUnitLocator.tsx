"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import type {
  PoliticsBundle,
  PollingUnitCountsBundle,
  PollingUnitShardEntry,
} from "@/types/politics";
import type { LgaLocation } from "@/types/location";
import {
  formatDelimitationDisplay,
  formatDelimitationInput,
  normalizeDelimitation,
} from "@/lib/politics/delimitation";
import {
  federalConstituenciesForLga,
  senatorialDistrictIdForLga,
} from "@/lib/politics/politicsForLga";
import { colorForDistrict } from "@/lib/politics/senatorialColors";
import {
  fetchPollingUnitsForState,
  resolvePollingUnitByDelimitation,
} from "@/lib/politics/fetchPollingUnits";
import { useMapStore } from "@/lib/store/mapStore";
import GetDirectionsButton from "@/components/directions/GetDirectionsButton";

interface PollingUnitLocatorProps {
  pollingCounts: PollingUnitCountsBundle;
  lgas: LgaLocation[];
  politics: PoliticsBundle;
}

export default function PollingUnitLocator({
  pollingCounts,
  lgas,
  politics,
}: PollingUnitLocatorProps) {
  const setSelectedSenatorialDistrict = useMapStore(
    (s) => s.setSelectedSenatorialDistrict
  );
  const { lookups, federalConstituencies } = politics;

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const resolved = useMapStore((s) => s.confirmedPollingUnit);
  const setResolved = useMapStore((s) => s.setConfirmedPollingUnit);

  const [lgaQuery, setLgaQuery] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState("");
  const [browseWardId, setBrowseWardId] = useState("");
  const [wardUnits, setWardUnits] = useState<PollingUnitShardEntry[]>([]);
  const [browsePuId, setBrowsePuId] = useState("");
  const [loadingWard, setLoadingWard] = useState(false);
  const [showLgaSuggestions, setShowLgaSuggestions] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(lgas, {
        keys: ["name", "stateName"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [lgas]
  );

  const lgaSuggestions = useMemo(() => {
    const q = lgaQuery.trim();
    if (q.length < 2) return [];
    return fuse.search(q, { limit: 8 }).map((r) => r.item);
  }, [fuse, lgaQuery]);

  const selectedLga = useMemo(
    () => lgas.find((l) => l.id === selectedLgaId),
    [lgas, selectedLgaId]
  );

  const resolvedLga = useMemo(
    () => (resolved ? lgas.find((l) => l.id === resolved.lgaId) : null),
    [lgas, resolved]
  );

  const displayLgaId = resolved?.lgaId ?? selectedLgaId;

  const senatorialDistrictId = displayLgaId
    ? senatorialDistrictIdForLga(lookups, displayLgaId)
    : null;
  const senatorialDistrict = senatorialDistrictId
    ? lookups.districtById[senatorialDistrictId]
    : null;
  const federalSeats = displayLgaId
    ? federalConstituenciesForLga(federalConstituencies, displayLgaId)
    : [];

  const directionsTarget = useMemo(() => {
    const lga = resolvedLga ?? selectedLga;
    if (!lga?.centroid) return null;
    const label = resolved
      ? `${resolved.name} (${formatDelimitationDisplay(resolved.delimitation)})`
      : lga.name;
    return { name: label, lonLat: lga.centroid as [number, number] };
  }, [resolved, resolvedLga, selectedLga]);

  const wardOptions = useMemo(() => {
    if (!selectedLgaId) return [];
    for (const s of pollingCounts.states) {
      const lga = s.lgas.find((l) => l.id === selectedLgaId);
      if (lga) return lga.wards;
    }
    return [];
  }, [pollingCounts.states, selectedLgaId]);

  const flyToSelection = useCallback(
    (lgaId: string, stateId: string) => {
      const lga = lgas.find((l) => l.id === lgaId);
      const store = useMapStore.getState();
      store.showLgas(stateId);
      store.setSelectedLga(lgaId);
      const map = store.mapInstance;
      if (map && lga?.centroid) {
        map.flyTo({
          center: lga.centroid,
          zoom: 11,
          duration: 900,
        });
      }
    },
    [lgas]
  );

  const onLookupCode = async () => {
    setCodeError(null);
    setResolved(null);
    const normalized = normalizeDelimitation(codeInput);
    if (!normalized) {
      setCodeError("Enter code as SS-LL-WW-PPP (e.g. 01-01-01-005)");
      return;
    }
    try {
      const hit = await resolvePollingUnitByDelimitation(normalized);
      if (!hit) {
        setCodeError("No polling unit found for that code.");
        return;
      }
      setResolved(hit.unit);
      setCodeInput(formatDelimitationDisplay(normalized));
      setSelectedLgaId(hit.unit.lgaId);
      flyToSelection(hit.unit.lgaId, hit.stateId);
    } catch {
      setCodeError("Polling unit data unavailable. Run npm run prebuild.");
    }
  };

  const pickLga = (lga: LgaLocation) => {
    setSelectedLgaId(lga.id);
    setLgaQuery(`${lga.name}, ${lga.stateName}`);
    setShowLgaSuggestions(false);
    setBrowseWardId("");
    setBrowsePuId("");
    setResolved(null);
  };

  useEffect(() => {
    if (!browseWardId || !selectedLga?.parentId) {
      setWardUnits([]);
      return;
    }
    let cancelled = false;
    setLoadingWard(true);
    fetchPollingUnitsForState(selectedLga.parentId)
      .then((units) => {
        if (cancelled) return;
        setWardUnits(units.filter((u) => u.wardId === browseWardId));
      })
      .catch(() => {
        if (!cancelled) setWardUnits([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWard(false);
      });
    return () => {
      cancelled = true;
    };
  }, [browseWardId, selectedLga?.parentId]);

  const onBrowsePuChange = (puId: string) => {
    setBrowsePuId(puId);
    const unit = wardUnits.find((u) => u.id === puId);
    if (unit && selectedLga?.parentId) {
      setResolved(unit);
      flyToSelection(unit.lgaId, selectedLga.parentId);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Find your polling unit</h2>
        <p className="text-xs text-slate-500 mt-1">
          Code or search an LGA, then pick ward and unit.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Delimitation code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(formatDelimitationInput(e.target.value));
              setCodeError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onLookupCode();
            }}
            placeholder="01-01-01-005"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tracking-wide"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void onLookupCode()}
            className="rounded-lg bg-ng-green px-3 py-2 text-sm font-semibold text-white shrink-0"
          >
            Find
          </button>
        </div>
        {codeError && (
          <p className="text-xs text-red-600" role="alert">
            {codeError}
          </p>
        )}
        <p className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-2.5 py-2 text-[11px] leading-snug text-sky-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 mt-0.5"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.052 3.135 9.386 8 10.623 4.865-1.237 8-5.571 8-10.623 0-.681-.056-1.351-.166-2A11.954 11.954 0 0110 1.944z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            We only need your polling unit code to find your unit — your VIN
            is never required. Keep your VIN (voter ID) secure and never share
            it with anyone.
          </span>
        </p>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Browse by LGA
        </p>
        <div className="relative">
          <input
            type="search"
            value={lgaQuery}
            onChange={(e) => {
              setLgaQuery(e.target.value);
              setShowLgaSuggestions(true);
              if (!e.target.value.trim()) {
                setSelectedLgaId("");
                setBrowseWardId("");
                setBrowsePuId("");
              }
            }}
            onFocus={() => setShowLgaSuggestions(true)}
            placeholder="Search LGA name…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {showLgaSuggestions && lgaSuggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {lgaSuggestions.map((lga) => (
                <li key={lga.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickLga(lga)}
                  >
                    <span className="font-medium">{lga.name}</span>
                    <span className="text-slate-500 text-xs ml-1">
                      · {lga.stateName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedLgaId && (
          <>
            <select
              value={browseWardId}
              onChange={(e) => {
                setBrowseWardId(e.target.value);
                setBrowsePuId("");
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Ward</option>
              {wardOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.pollingUnitCount} PUs)
                </option>
              ))}
            </select>
            <select
              value={browsePuId}
              disabled={!browseWardId || loadingWard}
              onChange={(e) => onBrowsePuChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">
                {loadingWard ? "Loading units…" : "Polling unit"}
              </option>
              {wardUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {formatDelimitationDisplay(u.delimitation)} — {u.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {resolved && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm space-y-3">
          <div>
            <p className="font-semibold text-slate-900">{resolved.name}</p>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              {formatDelimitationDisplay(resolved.delimitation)}
            </p>
            {resolved.status && (
              <p className="text-xs text-slate-500 mt-1">{resolved.status}</p>
            )}
          </div>

          {senatorialDistrict && senatorialDistrictId && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Senatorial district
              </p>
              <button
                type="button"
                onClick={() =>
                  setSelectedSenatorialDistrict(senatorialDistrictId)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:border-ng-green"
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{
                    backgroundColor: colorForDistrict(
                      lookups,
                      senatorialDistrictId
                    ),
                  }}
                  aria-hidden
                />
                {senatorialDistrict.name}
              </button>
            </div>
          )}

          {federalSeats.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Federal constituency
                {federalSeats.length > 1 ? " (constituencies)" : ""}
              </p>
              <ul className="text-xs text-slate-700 space-y-1">
                {federalSeats.map((fc) => (
                  <li key={fc.id} className="rounded-md bg-white/80 px-2 py-1">
                    {fc.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {directionsTarget && (
            <GetDirectionsButton
              name={directionsTarget.name}
              lonLat={directionsTarget.lonLat}
              kind="lga"
              size="md"
            />
          )}
        </div>
      )}
    </section>
  );
}
