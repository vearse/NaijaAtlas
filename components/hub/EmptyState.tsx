type Props = {
  title: string;
  children?: React.ReactNode;
  /** e.g. "Dataset not yet loaded" */
  badge?: string;
  className?: string;
};

/**
 * Honest empty state. Used where the spec calls for a module we do not have
 * data for yet, instead of shipping placeholder numbers.
 */
export default function EmptyState({
  title,
  children,
  badge = "Not yet available",
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 ${className}`}
    >
      <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {badge}
      </span>
      <h3 className="mt-3 text-headline-sm font-semibold text-text-primary">
        {title}
      </h3>
      {children && (
        <div className="mt-2 max-w-2xl text-body-sm text-text-secondary">
          {children}
        </div>
      )}
    </div>
  );
}
