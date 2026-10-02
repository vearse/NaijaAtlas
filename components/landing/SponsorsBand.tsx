import Image from "next/image";

// X handles are unconfirmed; neither site links one.
const SPONSORS = [
  {
    name: "Ise Owo",
    blurb: "Payments and money tools built for Nigerian businesses.",
    href: "https://iseowoapp.com?utm_source=naija-atlas",
    logo: "/images/ise-owo-logo.png",
    logoW: 132,
    logoH: 36,
    x: "iseowoapp",
  },
  {
    name: "KassleFlow",
    blurb: "Property management for short-let and multi-location operators.",
    href: "https://kassleflow.com/?utm_source=naija-atlas",
    logo: "/images/kassleflow-logo.svg",
    logoW: 156,
    logoH: 40,
    x: "kassleflow",
  },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

export default function SponsorsBand() {
  return (
    <section className="pt-14" aria-labelledby="sponsors-title">
      <p className="text-label-caps uppercase text-text-muted">Sponsored by</p>
      <h2 id="sponsors-title" className="font-landing-display text-headline-lg text-text-primary mt-1">
        The partners keeping NaijaAtlas free
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {SPONSORS.map((s) => (
          <div
            key={s.name}
            className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-border-subtle bg-surface-card p-6"
          >
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex h-20 w-44 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100"
            >
              <Image src={s.logo} alt={s.name} width={s.logoW} height={s.logoH} className="h-9 w-auto object-contain" />
            </a>
            <div className="min-w-0 flex-1">
              <p className="font-headline-sm text-headline-sm font-bold text-text-primary">{s.name}</p>
              <p className="text-body-sm text-text-secondary mt-0.5">{s.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center rounded-lg bg-primary-container px-3.5 py-2 text-label-md font-bold text-white hover:bg-primary"
                >
                  Visit {s.name}
                </a>
                <a
                  href={`https://x.com/${s.x}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.name} on X`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3.5 py-2 text-label-md font-bold text-text-primary hover:border-slate-400"
                >
                  <XIcon />@{s.x}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
