"use client";

interface PartyIconProps {
  icon?: string | null;
  abbreviation: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE = { sm: "h-7 w-7", md: "h-9 w-9" } as const;

export default function PartyIcon({
  icon,
  abbreviation,
  size = "sm",
  className = "",
}: PartyIconProps) {
  const dim = SIZE[size];
  if (icon) {
    return (
      <img
        src={icon}
        alt=""
        className={`${dim} shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80 bg-white ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span
      className={`${dim} shrink-0 rounded-lg bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 ${className}`}
      aria-hidden
    >
      {abbreviation.slice(0, 4)}
    </span>
  );
}
