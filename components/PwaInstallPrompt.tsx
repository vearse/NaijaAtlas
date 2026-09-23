"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/lib/store/mapStore";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "naija-atlas-install-dismissed";

export default function PwaInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mobileSheet = useMapStore((s) => s.mobileSheet);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    const iPadOS13Desktop =
      /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(ua) || iPadOS13Desktop;
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setInstallable(false);
      return;
    }

    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") setDismissed(true);
    } catch {
      /* storage unavailable — keep the banner */
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setInstallable(true);
    };

    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setInstallable(false);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      setShowIosHelp((v) => !v);
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt.current = null;
    if (outcome === "accepted") {
      setInstallable(false);
      setDismissed(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setInstallable(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (process.env.NODE_ENV !== "production") return null;
  if (dismissed) return null;
  if (!installable && !isIOS) return null;
  if (mobileSheet === "open") return null;

  return (
    <div className="fixed bottom-4 left-4 z-[45] max-w-[320px] animate-fade-in">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur px-3.5 py-3 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-ng-green text-white text-lg shadow-sm">
            🇳🇬
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              Install NaijaAtlas
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Add to your home screen for one-tap access & smoother offline
              browsing.
            </p>
            {showIosHelp && (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 text-[11px] leading-snug text-slate-600">
                Tap the <b>Share</b> button in Safari, then choose{" "}
                <b>Add to Home Screen</b>.
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-lg bg-ng-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                {isIOS ? "Add to Home Screen" : "Install App"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}