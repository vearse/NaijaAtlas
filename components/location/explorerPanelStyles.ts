/** Shared explorer / location panel styling — aligned with Places & Civic hubs */

export const explorerKickerClass =
  "inline-flex items-center rounded-full border border-lime-200 bg-lime-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary";

export const explorerSectionLabelClass =
  "text-label-caps font-bold uppercase tracking-wider text-text-muted";

export const explorerPanelCardClass =
  "rounded-2xl border border-border-subtle bg-surface-card shadow-sm";

export const explorerListCardClass =
  "rounded-2xl border border-border-subtle bg-surface-card overflow-hidden divide-y divide-border-subtle";

export const explorerStatAccents = [
  "border-l-emerald-500",
  "border-l-sky-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-teal-500",
] as const;

export function explorerStatTileClass(accentIndex = 0): string {
  const accent =
    explorerStatAccents[accentIndex % explorerStatAccents.length];
  return `rounded-xl border border-border-subtle border-l-4 ${accent} bg-gradient-to-br from-slate-50/90 to-white px-3 py-2.5 shadow-sm`;
}

export function explorerLensTabClass(active: boolean): string {
  return active
    ? "rounded-full bg-primary-container px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
    : "rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-primary-container/50 hover:text-primary";
}

export const explorerChipClass =
  "rounded-full border border-lime-200/80 bg-lime-50/80 px-2.5 py-1 text-xs font-medium text-slate-800";

export const explorerPanelHeaderClass =
  "border-b border-border-subtle bg-surface-card px-4 py-3 sm:px-5";

export const explorerTitleClass =
  "font-landing-display text-2xl font-bold tracking-tight text-text-primary sm:text-[1.65rem]";
