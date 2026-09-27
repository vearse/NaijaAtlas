"use client";

/** Shown in election browse when no state is selected on the map. */
export default function NationalAssemblyIntro() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 text-xs text-slate-700 leading-relaxed space-y-2">
      <p className="font-semibold text-slate-900">Nigeria&apos;s National Assembly</p>
      <p>
        Federal laws are made by a bicameral legislature: the{" "}
        <span className="font-medium">Senate</span> (upper chamber) and the{" "}
        <span className="font-medium">House of Representatives</span> (lower
        chamber).
      </p>
      <ul className="list-disc pl-4 space-y-1 text-slate-600">
        <li>
          <span className="font-medium text-slate-800">Senate</span> — 109
          senators (3 per state, 1 for the FCT). Each seat is a{" "}
          <span className="font-medium">senatorial district</span>.
        </li>
        <li>
          <span className="font-medium text-slate-800">House of Representatives</span>{" "}
          — 360 members, one per{" "}
          <span className="font-medium">federal constituency</span>.
        </li>
      </ul>
      <p className="text-slate-500">
        Select states on the map, or find your polling unit, to see districts
        and candidates for your area.
      </p>
    </div>
  );
}
