"use client";

import { useEffect, useCallback } from "react";
import LocationSearch from "@/components/search/LocationSearch";
import type { LgaLocation } from "@/types/location";

interface SearchSpotlightProps {
  open: boolean;
  onClose: () => void;
  lgas?: LgaLocation[];
}

/**
 * macOS-Spotlight-style floating search: a dimmed, blurred backdrop with a
 * centered elevated bar. Recorded for small + md screens where the inline
 * header search is collapsed behind an icon button.
 */
export default function SearchSpotlight({ open, onClose, lgas }: SearchSpotlightProps) {
  const closeOnEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", closeOnEscape);
    document.getElementById("location-search")?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, closeOnEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[16vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search states, LGAs, landmarks and minerals"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
        <LocationSearch lgas={lgas} />
      </div>
    </div>
  );
}
