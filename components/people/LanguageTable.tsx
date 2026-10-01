import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";
import type { PeopleHubData } from "@/lib/server/loadPeopleHubData";

/** Languages per state, taken from the state general profiles. */
export default function LanguageTable({
  languages,
  slugByStateId,
}: {
  languages: PeopleHubData["languages"];
  slugByStateId: Record<string, string>;
}) {
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-card">
        <table className="w-full min-w-[28rem] text-left text-body-sm">
          <caption className="sr-only">Languages spoken, by state</caption>
          <thead className="border-b border-border-subtle bg-slate-50 text-label-caps text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                State
              </th>
              <th scope="col" className="px-4 py-3">
                Languages
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {languages.map((l) => (
              <tr key={l.stateId} className="hover:bg-slate-50">
                <th scope="row" className="px-4 py-3 font-semibold">
                  <Link
                    href={`/places/${slugByStateId[l.stateId]}`}
                    className="text-text-primary hover:text-primary"
                  >
                    {l.name}
                  </Link>
                </th>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    {l.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full border border-border-subtle bg-slate-50 px-2 py-0.5 text-[11px] text-text-secondary"
                      >
                        {lang}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-body-sm text-text-muted">
        Language lists are the headline languages recorded in each state
        profile, not an exhaustive count of every language spoken within it.
      </p>

      <SourceNote
        className="mt-6"
        source="State general profiles"
        updated="Repository dataset"
      />
    </div>
  );
}
