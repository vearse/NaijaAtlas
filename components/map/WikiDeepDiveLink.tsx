"use client";

import { useMapStore } from "@/lib/store/mapStore";

interface WikiDeepDiveLinkProps {
  wikiUrl: string;
  title?: string;
  className?: string;
  variant?: "inline" | "button";
}

export default function WikiDeepDiveLink({
  wikiUrl,
  title,
  className = "",
  variant = "inline",
}: WikiDeepDiveLinkProps) {
  const openWikiModal = useMapStore((s) => s.openWikiModal);

  const base =
    variant === "button"
      ? "inline-flex items-center justify-center rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50 hover:border-sky-300 transition-colors"
      : "inline-flex text-sm font-medium text-sky-800 hover:text-sky-950 underline underline-offset-2";

  return (
    <button
      type="button"
      onClick={() => openWikiModal(wikiUrl, title)}
      className={`${base} ${className}`.trim()}
    >
      Deep dive
    </button>
  );
}
