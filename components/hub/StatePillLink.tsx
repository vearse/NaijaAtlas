import Link from "next/link";

type PillProps = {
  /** Catalogue state name, shown verbatim. */
  name: string;
  /** Canonical Places slug, or undefined when the catalogue name is not a state. */
  slug: string | undefined;
  className?: string;
  linkClassName?: string;
  /** Trailing glyph shown on linked rows. */
  arrow?: boolean;
};

/**
 * State name that links to the Places page only when the name actually maps to
 * a real state. The overlay catalogues contain prose like "Lagos (vicinity)"
 * and "Abuja-FCT" which have no state page, so those render as plain text
 * instead of a link to a 404.
 */
export function StatePillLink({
  name,
  slug,
  className = "flex flex-wrap gap-1.5",
  linkClassName = "rounded-full border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-container hover:text-primary",
  arrow = false,
}: PillProps) {
  return (
    <div className={className}>
      {slug ? (
        <Link href={`/places/${slug}`} className={linkClassName}>
          {name}
          {arrow ? <span aria-hidden>&rarr;</span> : null}
        </Link>
      ) : (
        <span
          className={linkClassName.replace(
            "hover:border-primary-container hover:text-primary",
            "text-text-muted"
          )}
        >
          {name}
        </span>
      )}
    </div>
  );
}

type ListProps = {
  states: string[];
  /** State name -> Places slug. */
  slugByStateId: Record<string, string>;
};

/** Row of state names, linked where a Places page exists. */
export function StatePillLinkList({ states, slugByStateId }: ListProps) {
  if (states.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {states.map((name) => (
        <StatePillLink key={name} name={name} slug={slugByStateId[name]} />
      ))}
    </div>
  );
}
