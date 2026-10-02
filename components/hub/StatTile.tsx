import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  /** Small status pill above the label, e.g. "ACTIVE SECTOR". */
  badge?: string;
  badgeClass?: string;
  /** Emphasise the tile (2px green border + tinted fill). */
  highlighted?: boolean;
  /** Trailing arrow that nudges right on hover. */
  arrow?: boolean;
  accentClass?: string;
  className?: string;
};

/** KPI tile — eyebrow label, metric-mono value, optional hint. */
export default function StatTile({
  label,
  value,
  hint,
  icon,
  badge,
  badgeClass = "bg-primary-tint-soft text-primary",
  highlighted = false,
  arrow = false,
  accentClass = "text-primary",
  className = "",
}: Props) {
  return (
    <div
      className={`group rounded-2xl p-5 shadow-sm transition-shadow ${
        highlighted
          ? "bg-primary-tint-light border-2 border-primary-container"
          : "bg-surface-card border border-border-subtle hover:shadow-md"
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={accentClass}>{icon}</span>}
        <p className="text-label-caps text-text-muted">{label}</p>
      </div>
      {badge && (
        <span
          className={`mt-2 inline-block px-2 py-0.5 rounded text-[11px] font-label-caps font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
      )}
      <p
        className={`mt-3 font-landing-display text-headline-xl font-bold tabular-nums tracking-tight ${
          highlighted ? "text-primary" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        {hint && <p className="text-body-sm text-text-secondary">{hint}</p>}
        {arrow && (
          <span
            className="text-text-muted transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        )}
      </div>
    </div>
  );
}