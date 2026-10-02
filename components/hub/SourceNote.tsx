type Props = {
  /** e.g. "INEC · NBS" */
  source: string;
  /** e.g. "Updated Sep 2026" */
  updated?: string;
  className?: string;
};

/** "Source: INEC · Updated Mar 2026" — the credibility line under dynamic widgets. */
export default function SourceNote({ source, updated, className = "" }: Props) {
  return (
    <p className={`text-body-sm text-text-muted ${className}`}>
      Source: {source}
      {updated ? ` · Updated ${updated}` : null}
    </p>
  );
}
