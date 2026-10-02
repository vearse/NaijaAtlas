"use client";

import { useState } from "react";
import Link from "next/link";
import SourceNote from "@/components/hub/SourceNote";

const PROCESS = [
  { label: "Register to vote", detail: "PVC or INEC portal" },
  { label: "Find your PU", detail: "Delimitation code" },
  { label: "Know your reps", detail: "Senate and House" },
  { label: "Track bills", detail: "NASS plenary records" },
  { label: "Contact your MP", detail: "Constituency office" },
];

const FAQ = [
  {
    q: "What does the Senate do?",
    a: "The Senate reviews and passes legislation, approves the federal budget and confirms cabinet appointments. Each state gets three senators, so the chamber is deliberately built around state parity rather than population.",
  },
  {
    q: "Senate versus House of Reps?",
    a: "Both chambers must agree on a bill before it becomes law. The Senate is organised by senatorial district and is constitutionally equal per state; the House is organised by federal constituency and is apportioned to population.",
  },
  {
    q: "How are constituencies drawn?",
    a: "The INEC delimitation commission divides each state into senatorial districts and then into federal constituencies, using population figures from the census and returning the population of the most populous constituency toward the national average.",
  },
  {
    q: "When is the next election?",
    a: "The 2027 general election is scheduled for 16 January 2027, with INEC announcing the timetable in stages. Polling units, results and turnout are all tracked on the election map.",
  },
];

export default function AssemblyExplainer({
  senateSeats,
  houseSeats,
  assemblyUrl,
}: {
  senateSeats: number;
  houseSeats: number;
  assemblyUrl: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  const stats = [
    {
      value: senateSeats.toString(),
      label: "Senate seats",
      detail: "3 per state plus 1 for the FCT",
    },
    {
      value: houseSeats.toString(),
      label: "House of Reps seats",
      detail: "Apportioned by population",
    },
    { value: "4", label: "Years per term", detail: "No constitutional term limit" },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm"
          >
            <p className="font-landing-display text-metric-mono text-text-primary">
              {s.value}
            </p>
            <p className="mt-1 text-body-md font-semibold text-slate-800">
              {s.label}
            </p>
            <p className="mt-0.5 text-body-sm text-text-muted">{s.detail}</p>
          </div>
        ))}
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PROCESS.map((step, i) => (
          <li
            key={step.label}
            className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface-card p-4 text-center shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-label-md font-bold text-primary">
              {i + 1}
            </span>
            <p className="mt-3 text-body-sm font-semibold text-text-primary">
              {step.label}
            </p>
            <p className="mt-0.5 text-body-sm text-text-muted">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
        {FAQ.map((item, i) => {
          const expanded = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
              >
                <span className="text-body-md font-semibold text-text-primary">
                  {item.q}
                </span>
                <span className="shrink-0 text-slate-400" aria-hidden>
                  {expanded ? "−" : "+"}
                </span>
              </button>
              {expanded && (
                <p className="border-t border-slate-100 px-5 py-4 text-body-sm text-text-secondary">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-landing-display text-headline-sm text-text-primary">
            Explore all {houseSeats} federal constituencies
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            Every state, LGA and constituency boundary on the election map.
          </p>
        </div>
        <Link
          href={assemblyUrl}
          className="inline-flex h-11 shrink-0 items-center rounded-xl bg-primary-container px-5 text-label-md text-white hover:bg-[#006d40]"
        >
          Browse the directory
        </Link>
      </div>

      <SourceNote
        className="mt-6"
        source="INEC delimitation · Constitution of Nigeria"
        updated="2026"
      />
    </div>
  );
}
