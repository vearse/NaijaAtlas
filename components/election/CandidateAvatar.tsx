"use client";

function CandidateAvatar({ name }: { name: string }) {
  return (
    <div
      className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-white shadow-sm flex items-center justify-center overflow-hidden"
      aria-hidden
      title={name}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 text-slate-400"
        fill="currentColor"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

export function CandidateRow({
  name,
  party,
  subtitle,
}: {
  name: string;
  party: string;
  subtitle?: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
      <CandidateAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>
      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
        {party}
      </span>
    </li>
  );
}

export function PresidentialTicketRow({
  partyAbbr,
  partyName,
  president,
  vice,
}: {
  partyAbbr: string;
  partyName?: string;
  president: string;
  vice: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <CandidateAvatar name={president} />
      <div className="min-w-0 flex-1 text-sm">
        <p>
          <span className="font-bold text-ng-green">{partyAbbr}</span>
          {partyName && (
            <span className="text-slate-400 text-xs ml-1">{partyName}</span>
          )}
        </p>
        <p className="font-medium text-slate-900 mt-0.5">{president}</p>
        <p className="text-xs text-slate-500">VP: {vice}</p>
      </div>
    </li>
  );
}
