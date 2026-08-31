"use client";

import type { ReactNode } from "react";
import { useMapStore } from "@/lib/store/mapStore";

interface MobileBottomSheetProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hasContent: boolean;
}

export default function MobileBottomSheet({
  title,
  subtitle,
  children,
  hasContent,
}: MobileBottomSheetProps) {
  const { mobileSheet, openMobileSheet, peekMobileSheet, closeMobileSheet } =
    useMapStore();

  if (!hasContent && mobileSheet === "hidden") return null;

  const isOpen = mobileSheet === "open";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] lg:hidden"
          onClick={peekMobileSheet}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 lg:hidden flex flex-col bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] border-t border-slate-200/80 transition-[transform,max-height] duration-300 ease-out ${
          mobileSheet === "hidden"
            ? "translate-y-full pointer-events-none"
            : "translate-y-0"
        }`}
        style={{ maxHeight: isOpen ? "min(46vh, 420px)" : "3.25rem" }}
      >
        {/* Peek bar — always tappable */}
        <div className="relative shrink-0 flex items-center gap-2 px-3 pb-2 pt-3 border-b border-slate-100 min-h-[3.25rem]">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200" />
          <button
            type="button"
            onClick={() => (isOpen ? peekMobileSheet() : openMobileSheet())}
            className="flex-1 flex items-center gap-2 text-left min-w-0 pt-2"
            aria-expanded={isOpen}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <span className="text-slate-400 text-xs shrink-0 ml-auto" aria-hidden>
              {isOpen ? "▼" : "▲"}
            </span>
          </button>
          <button
            type="button"
            onClick={closeMobileSheet}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-lg leading-none"
            aria-label="Dismiss panel"
          >
            ×
          </button>
        </div>

        {/* Scrollable content — only when open */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
