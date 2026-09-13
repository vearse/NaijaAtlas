import type { CompareRow } from "@/types/compare";
import { highlightIndices } from "@/lib/compare/resolveRows";
import {
  ComparePersonBlock,
  ComparePersonList,
} from "./ComparePersonAvatar";
import { useMapStore } from "@/lib/store/mapStore";
import type { StateLanguage } from "@/types/location";

interface CompareMetricsTableProps {
  rows: CompareRow[];
  /** Column headers — state names or ["Nigeria"] for country */
  columns: string[];
  /** Single-column key-value layout for country overview */
  layout?: "compare" | "profile";
  /** Clickable Wikipedia languages keyed by column name (state language bundle) */
  languageLinks?: Record<string, StateLanguage[]>;
}

function LanguageChips({ languages }: { languages: StateLanguage[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {languages.map((lang) => (
        <button
          key={lang.name}
          type="button"
          onClick={() =>
            useMapStore.getState().openWikiModal(lang.wikiUrl, lang.name)
          }
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 text-xs font-medium px-2 py-0.5 transition-colors"
          title={`Open Wikipedia: ${lang.name}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

function renderCell(row: CompareRow, colIndex: number) {
  const cell = row.values[colIndex];
  if (!cell) return "—";

  if (row.type === "person" && cell.person) {
    return <ComparePersonBlock person={cell.person} compact />;
  }

  if (row.type === "personList" && cell.persons?.length) {
    return <ComparePersonList persons={cell.persons} />;
  }

  return cell.display;
}

export default function CompareMetricsTable({
  rows,
  columns,
  layout = "compare",
  languageLinks,
}: CompareMetricsTableProps) {
  if (layout === "profile") {
    return (
      <dl className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
        {rows.map((row) => {
          const cell = row.values[0];
          return (
            <div key={row.key} className="px-3 py-2.5 flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="text-xs font-medium text-slate-500 sm:w-[40%] shrink-0">
                {row.label}
              </dt>
              <dd className="text-sm font-medium text-slate-800 sm:flex-1 min-w-0">
                {cell ? renderCell(row, 0) : "—"}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 overflow-x-auto">
      <table className="w-full text-sm min-w-[280px]">
        <thead>
          <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
            <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50">
              Metric
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="text-right px-3 py-2 font-semibold min-w-[88px]"
              >
                {col.length > 10 ? col.slice(0, 9) + "…" : col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hi = highlightIndices(row);
            return (
              <tr key={row.key} className="border-t border-slate-100">
                <td className="px-3 py-2.5 text-slate-500 align-top sticky left-0 bg-white">
                  {row.label}
                </td>
                {row.values.map((_, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 text-right align-top font-medium min-w-[88px] ${
                      hi.has(i) ? "text-ng-green" : "text-slate-800"
                    } ${row.type === "person" || row.type === "personList" ? "text-left" : ""}`}
                  >
                    {row.key === "languages" &&
                    languageLinks &&
                    languageLinks[columns[i]]?.length ? (
                      <LanguageChips languages={languageLinks[columns[i]]!} />
                    ) : (
                      renderCell(row, i)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
