import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title?: string;
  lede?: string;
  aside?: ReactNode;
  /** Small icon tile rendered to the left of the heading block. */
  icon?: React.ReactNode;
  /** Optional full-bleed tinted band behind the section. */
  bandClass?: string;
  children: ReactNode;
  className?: string;
};

/** Major block on a hub page: generous vertical rhythm, optional eyebrow/H2/lede. */
export default function HubSection({
  id,
  eyebrow,
  title,
  lede,
  aside,
  icon,
  bandClass,
  children,
  className = "",
}: Props) {
  const band = bandClass ?? "";
  const inner = bandClass ? "max-w-7xl mx-auto px-4 md:px-8" : "";

  return (
    <section
      id={id}
      className={`scroll-mt-32 ${band} ${
        bandClass ? "py-14 md:py-20 border-b border-border-subtle" : "py-12 md:py-16"
      } ${className}`}
    >
      <div className={inner}>
        {(title || eyebrow || lede || aside) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              {eyebrow && (
                <p className="text-label-caps uppercase text-primary mb-2">
                  {eyebrow}
                </p>
              )}
              <div className="flex items-center gap-2">
                {icon && (
                  <span className="w-7 h-7 rounded-lg bg-primary-container text-white flex items-center justify-center shrink-0">
                    {icon}
                  </span>
                )}
                {title && (
                  <h2 className="font-landing-display text-headline-xl text-text-primary tracking-tight">
                    {title}
                  </h2>
                )}
              </div>
              {lede && <p className="text-body-md text-text-secondary mt-2">{lede}</p>}
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}