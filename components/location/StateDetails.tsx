import type { CompareBundle } from "@/types/compare";
import type { StateContent, StateLocation, LgaLocation } from "@/types/location";
import { formatStateLandArea } from "@/lib/compare/landArea";
import ShowLgasButton from "@/components/map/ShowLgasButton";

interface StateDetailsProps {
  content: StateContent;
  location: StateLocation;
  lgas: LgaLocation[];
  compareBundle?: CompareBundle;
  selectedLgaId?: string | null;
  onSelectLga?: (id: string) => void;
}

export default function StateDetails({
  content,
  location,
  lgas,
  compareBundle,
  selectedLgaId,
  onSelectLga,
}: StateDetailsProps) {
  const stateLgas = lgas
    .filter((l) => l.parentId === location.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const wardTotal = stateLgas.reduce((n, l) => n + l.wardCount, 0);
  const landArea = formatStateLandArea(compareBundle, location.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ng-green">
          {content.region}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">{content.name}</h2>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Land area
          </dt>
          <dd className="text-lg font-bold text-ng-green mt-0.5">{landArea}</dd>
        </div>
        {content.capital && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Capital
            </dt>
            <dd className="text-sm font-semibold text-slate-800 mt-0.5">
              {content.capital}
            </dd>
          </div>
        )}
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Region
          </dt>
          <dd className="text-sm font-semibold text-slate-800 mt-0.5">
            {location.regionName}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            LGAs
          </dt>
          <dd className="text-sm font-semibold text-slate-800 mt-0.5">
            {content.lgaCount}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Wards
          </dt>
          <dd className="text-sm font-semibold text-slate-800 mt-0.5">
            {wardTotal > 0 ? wardTotal : "—"}
          </dd>
        </div>
      </dl>

      <ShowLgasButton stateId={location.id} stateName={location.name} />

      <p className="text-xs text-slate-500 -mt-2 text-center leading-relaxed">
        Double-click {location.name} on the map to show LGAs, or use the button
        above.
      </p>

      <p className="text-sm text-slate-600 leading-relaxed">
        {content.description}
      </p>

      {stateLgas.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Local government areas ({stateLgas.length})
          </h3>
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
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
