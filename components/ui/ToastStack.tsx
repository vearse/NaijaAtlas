"use client";

import { useEffect } from "react";
import { useToastStore, type Toast, type ToastKind } from "@/lib/store/toastStore";

const ICONS: Record<ToastKind, string> = {
  info: "ℹ️",
  success: "✅",
  tip: "💡",
};

const KIND_STYLES: Record<ToastKind, string> = {
  info: "border-slate-200",
  success: "border-emerald-200",
  tip: "border-sky-200",
};

const AUTO_DISMISS_MS = 3800;

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = window.setTimeout(
      () => dismissToast(toast.id),
      AUTO_DISMISS_MS
    );
    return () => window.clearTimeout(timer);
  }, [toast.id, dismissToast]);

  return (
    <button
      type="button"
      onClick={() => dismissToast(toast.id)}
      className={`animate-fade-in pointer-events-auto flex items-start gap-2 rounded-xl border bg-white/95 backdrop-blur px-3.5 py-2.5 text-left text-sm shadow-lg hover:bg-white ${KIND_STYLES[toast.kind]}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-base leading-none shrink-0 pt-0.5" aria-hidden>
        {ICONS[toast.kind]}
      </span>
      <span className="min-w-0 flex-1 text-slate-700 font-medium leading-snug">
        {toast.message}
      </span>
    </button>
  );
}

export default function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}