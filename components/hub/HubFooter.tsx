import Link from "next/link";
import NaijaAtlasMark from "@/components/brand/NaijaAtlasMark";
import PartnerLogosRow from "@/components/brand/PartnerLogosRow";
import { naijaAtlasXUrl } from "@/lib/social";

const LINKS = [
  { label: "Open Data Portal", href: "/data" },
  { label: "Election Bureau", href: "/civic" },
  { label: "State Factsheets", href: "/places" },
  { label: "Methodology", href: "/data#sources" },
];

export default function HubFooter() {
  const xUrl = naijaAtlasXUrl();
  return (
    <footer className="mt-auto bg-surface-card border-t border-border-subtle py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <div>
          <p className="text-label-caps uppercase text-text-muted mb-3">Partners</p>
          <PartnerLogosRow muted showJoinTile />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-body-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <NaijaAtlasMark size="sm" wordmarkClassName="font-landing-display text-headline-sm font-bold text-primary" />
          <span className="hidden sm:inline text-slate-300" aria-hidden>
            ·
          </span>
          <p className="text-text-muted text-center sm:text-left">
            © {new Date().getFullYear()} NaijaAtlas. Open civic intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 font-label-caps text-label-caps">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {xUrl ? (
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NaijaAtlas on X"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
              </svg>
            </a>
          ) : null}
        </div>
        </div>
      </div>
    </footer>
  );
}
