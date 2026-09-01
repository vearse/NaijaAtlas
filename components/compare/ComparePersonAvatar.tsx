"use client";

import { useState } from "react";
import type { ComparePerson } from "@/types/compare";

interface ComparePersonAvatarProps {
  person: ComparePerson;
  size?: "sm" | "md";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ComparePersonAvatar({
  person,
  size = "sm",
}: ComparePersonAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const text = size === "md" ? "text-xs" : "text-[10px]";

  if (person.imageUrl && !failed) {
    return (
      <img
        src={person.imageUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${dim} rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <span
      className={`${dim} ${text} rounded-full shrink-0 bg-ng-green/15 text-ng-green font-bold flex items-center justify-center ring-2 ring-white`}
      aria-hidden
    >
      {initials(person.name)}
    </span>
  );
}

interface ComparePersonBlockProps {
  person: ComparePerson;
  compact?: boolean;
}

export function ComparePersonBlock({
  person,
  compact = false,
}: ComparePersonBlockProps) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "py-0.5"}`}>
      <ComparePersonAvatar person={person} size={compact ? "sm" : "md"} />
      <div className="min-w-0 text-left">
        <p className="font-medium text-slate-800 leading-tight truncate">
          {person.name}
        </p>
        {person.party && (
          <p className="text-[10px] text-slate-500 mt-0.5">{person.party}</p>
        )}
      </div>
    </div>
  );
}

interface ComparePersonListProps {
  persons: ComparePerson[];
}

export function ComparePersonList({ persons }: ComparePersonListProps) {
  return (
    <ul className="space-y-2 text-left">
      {persons.map((p) => (
        <li key={p.name}>
          <ComparePersonBlock person={p} compact />
        </li>
      ))}
    </ul>
  );
}
