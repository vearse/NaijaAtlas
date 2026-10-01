import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Sticky 13px muted trail directly under the hub header. */
export default function HubBreadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <div className="sticky top-16 z-40 bg-surface-card/95 backdrop-blur border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 text-body-sm text-text-muted">
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          {trail.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              <span aria-hidden className="text-slate-300">
                /
              </span>
              {c.href ? (
                <Link href={c.href} className="hover:text-primary transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-text-primary font-medium">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
