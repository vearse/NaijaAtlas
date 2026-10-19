"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LgaLocation, RegionLocation, StateLocation } from "@/types/location";
import { useToastStore } from "@/lib/store/toastStore";
import {
  buildCaptureFilename,
  buildShareText,
  captureMapFrame,
  capturePanelFrame,
  captureWorkspaceFrame,
  type CaptureScope,
} from "@/lib/map/captureSnapshot";

const PREVIEW_TITLES: Record<CaptureScope, string> = {
  map: "Map screenshot",
  panel: "Panel screenshot",
  workspace: "Full view screenshot",
};

type Props = {
  presetTitle: string;
  presetLabel: string;
  mapFrameRef: React.RefObject<HTMLElement | null>;
  workspaceRef: React.RefObject<HTMLElement | null>;
  states: StateLocation[];
  regions: RegionLocation[];
  lgas: LgaLocation[];
};

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M1 8.25a1.75 1.75 0 011.75-1.75h1.662a4.875 4.875 0 019.683 0H15.25A1.75 1.75 0 0117 8.25v6.5A1.75 1.75 0 0115.25 16.5H4.75A1.75 1.75 0 013 14.75v-6.5zm5.25 3.25a3.25 3.25 0 106.5 0 3.25 3.25 0 00-6.5 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v11.5A2.25 2.25 0 0115.75 18H4.25A2.25 2.25 0 012 15.75V4.25zm4.25-.75a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h7.5a.75.75 0 00.75-.75V4.25a.75.75 0 00-.75-.75h-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v11.5A2.25 2.25 0 0115.75 18H4.25A2.25 2.25 0 012 15.75V4.25zm3.75-.75a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h3.75a.75.75 0 00.75-.75V4.25a.75.75 0 00-.75-.75h-3.75zm6 0a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h3.75a.75.75 0 00.75-.75V4.25a.75.75 0 00-.75-.75h-3.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function MapCaptureShare({
  presetTitle,
  presetLabel,
  mapFrameRef,
  workspaceRef,
  states,
  regions,
  lgas,
}: Props) {
  const pushToast = useToastStore((s) => s.pushToast);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewScope, setPreviewScope] = useState<CaptureScope | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const previewBlobRef = useRef<Blob | null>(null);

  const clearPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    previewBlobRef.current = null;
    setPreviewScope(null);
  }, [previewUrl]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearPreview();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewUrl, clearPreview]);

  const runCapture = async (scope: CaptureScope) => {
    setMenuOpen(false);
    setBusy(true);
    try {
      if (scope === "map" && !mapFrameRef.current) {
        throw new Error("Map is not ready yet.");
      }
      if (scope === "workspace" && !workspaceRef.current) {
        throw new Error("Workspace is not ready yet.");
      }
      const blob =
        scope === "map"
          ? await captureMapFrame(mapFrameRef.current!)
          : scope === "panel"
            ? await capturePanelFrame()
            : await captureWorkspaceFrame(workspaceRef.current!);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      previewBlobRef.current = blob;
      setPreviewScope(scope);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Screenshot failed. Try again.";
      pushToast(message, "info");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = previewBlobRef.current;
    if (!blob || !previewScope) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildCaptureFilename(presetTitle, previewScope);
    a.click();
    URL.revokeObjectURL(a.href);
    pushToast("Image downloaded", "success");
  };

  const copyImage = async () => {
    const blob = previewBlobRef.current;
    if (!blob) return;
    try {
      if (!navigator.clipboard?.write) {
        pushToast("Copy not supported in this browser", "info");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      pushToast("Image copied to clipboard", "success");
    } catch {
      pushToast("Could not copy image", "info");
    }
  };

  const share = async () => {
    const blob = previewBlobRef.current;
    if (!blob || !previewScope) return;
    const text = buildShareText(presetLabel, states, regions, lgas);
    const file = new File(
      [blob],
      buildCaptureFilename(presetTitle, previewScope),
      { type: "image/png" }
    );
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        pushToast("Link copied to clipboard", "success");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Screenshot and share"
          className="inline-flex h-9 min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 text-label-md font-semibold text-slate-700 hover:border-[#008751] hover:text-[#006b3f] disabled:opacity-50"
        >
          <CameraIcon />
          <span className="hidden sm:inline">Share</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Screenshot options"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
              onClick={() => runCapture("map")}
            >
              <span className="mt-0.5 text-slate-500">
                <CameraIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Map area
                </span>
                <span className="block text-[11px] text-slate-500">
                  Map, layers, legends and controls
                </span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-start gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"
              onClick={() => runCapture("panel")}
            >
              <span className="mt-0.5 text-slate-500">
                <PanelIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Panel
                </span>
                <span className="block text-[11px] text-slate-500">
                  Side panel or open mobile sheet
                </span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-start gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"
              onClick={() => runCapture("workspace")}
            >
              <span className="mt-0.5 text-slate-500">
                <LayoutIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Full view
                </span>
                <span className="block text-[11px] text-slate-500">
                  Map and panel together
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close preview"
            onClick={clearPreview}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                {previewScope ? PREVIEW_TITLES[previewScope] : "Screenshot"}
              </p>
              <button
                type="button"
                onClick={clearPreview}
                className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="mx-auto max-h-[50vh] w-auto max-w-full rounded-lg border border-slate-200 shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={download}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#043828] px-3 text-sm font-semibold text-white"
              >
                Download
              </button>
              <button
                type="button"
                onClick={copyImage}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={share}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-[#008751] px-3 text-sm font-semibold text-[#006b3f]"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
