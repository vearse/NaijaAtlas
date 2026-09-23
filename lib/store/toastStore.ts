import { create } from "zustand";

export type ToastKind = "info" | "success" | "tip";

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: Toast[];
  pushToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
}

let nextToastId = 1;
const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (message, kind = "info") => {
    if (get().toasts.some((t) => t.message === message)) return;
    const toast: Toast = { id: nextToastId++, message, kind };
    set({ toasts: [...get().toasts, toast].slice(-MAX_TOASTS) });
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));