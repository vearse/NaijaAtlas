import Link from "next/link";
import NaijaAtlasMark from "@/components/brand/NaijaAtlasMark";
import PartnerLogosRow from "@/components/brand/PartnerLogosRow";

const LINKS = [
  { label: "Open Data Portal", href: "/data" },
  { label: "Election Bureau", href: "/civic" },
  { label: "State Factsheets", href: "/places" },
  { label: "Methodology", href: "/data" },
  { label: "Privacy & Terms", href: "/places" },
];

export default function HubFooter() {
  return (
    <footer className="mt-auto bg-surface-card border-t border-border-subtle py-8">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <div>
          <p className="text-label-caps uppercase text-text-muted mb-3">Partners</p>
          <PartnerLogosRow muted />
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
        </div>
        </div>
      </div>
    </footer>
  );
}
