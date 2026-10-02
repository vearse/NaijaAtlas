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

export default function LandingFooter() {
  return (
    <footer className="mt-20 bg-surface-card border-t border-border-subtle">
      <div className="w-full px-4 md:px-6 py-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <NaijaAtlasMark
              wordmarkClassName="font-landing-display text-headline-md font-extrabold text-text-primary"
            />
            <p className="text-body-sm text-text-muted text-center md:text-left">
              © {new Date().getFullYear()} NaijaAtlas. Open Civic Intelligence &
              Geopolitical Infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {LINKS.map((l, i) => (
              <Link
                key={l.label}
                href={l.href}
                className={`text-label-md transition-colors duration-200 ${
                  i === 0
                    ? "text-primary font-semibold hover:text-primary-container"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

        <div className="flex items-center gap-3">
          <span className="text-body-sm text-text-secondary font-medium">
            Made in Nigeria 🇳🇬
          </span>
          <span className="w-2 h-2 rounded-full bg-primary-container" aria-hidden />
        </div>
        </div>

        <div>
          <p className="text-label-caps uppercase text-text-muted mb-3">Partners</p>
          <PartnerLogosRow muted />
        </div>
      </div>
    </footer>
  );
}