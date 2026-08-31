import type { StateContent, StateLocation, LgaLocation } from "@/types/location";
import ShowLgasButton from "@/components/map/ShowLgasButton";

interface StateDetailsProps {
  content: StateContent;
  location: StateLocation;
  lgas: LgaLocation[];
  selectedLgaId?: string | null;
  onSelectLga?: (id: string) => void;
}

export default function StateDetails({
  content,
  location,
  lgas,
  selectedLgaId,
  onSelectLga,
}: StateDetailsProps) {
  const stateLgas = lgas
    .filter((l) => l.parentId === location.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ng-green">
          {content.region}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">{content.name}</h2>
      </div>

      <ShowLgasButton stateId={location.id} stateName={location.name} />

      <p className="text-xs text-slate-500 -mt-2 text-center">
        Or double-click {location.name} on the map
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {content.capital && (
          <>
            <dt className="text-slate-500">Capital</dt>
            <dd className="font-medium">{content.capital}</dd>
          </>
        )}
        <dt className="text-slate-500">Region</dt>
        <dd className="font-medium">{location.regionName}</dd>
        <dt className="text-slate-500">LGAs</dt>
        <dd className="font-medium">{content.lgaCount}</dd>
        <dt className="text-slate-500">Code</dt>
        <dd className="font-mono text-xs font-medium text-slate-700">
          {location.id}
        </dd>
      </dl>

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
