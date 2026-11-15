"use client";

import { useEffect, useRef, useState } from "react";

export default function ShareScenarioModal({
  open,
  url,
  onClose,
}: {
  open: boolean;
  url: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close share dialog"
        className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-scenario-title"
          className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-2xl animate-scale-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="share-scenario-title"
                className="text-lg font-bold text-text-primary"
              >
                Share scenario
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Anyone with this link can open the same speculation scenario.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-text-muted hover:bg-slate-100 hover:text-text-primary"
            >
              ×
            </button>
          </div>

          <input
            ref={inputRef}
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-4 w-full rounded-xl border border-border-subtle bg-slate-50 px-3 py-2 text-xs text-text-secondary"
            aria-label="Scenario link"
          />

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-subtle px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary"
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
