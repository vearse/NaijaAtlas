import Image from "next/image";
import { PARTNERS, PARTNER_JOIN_URL } from "@/lib/partners";

type Props = {
  /** Show the “Join us” tile (home sponsors band). */
  showJoinTile?: boolean;
  /** Grayscale logos until hover — typical for footer strips. */
  muted?: boolean;
  className?: string;
};

export default function PartnerLogosRow({
  showJoinTile = false,
  muted = false,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-8 ${className}`}
      aria-label="Partners"
    >
      {PARTNERS.map((p) => (
        <a
          key={p.name}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`flex h-14 min-w-[120px] items-center justify-center rounded-xl border border-border-subtle bg-surface-card px-5 transition-colors hover:border-primary/40 hover:bg-primary-tint-light ${
            muted ? "opacity-80 hover:opacity-100" : ""
          }`}
          title={p.name}
        >
          <Image
            src={p.logo}
            alt={p.name}
            width={p.logoW}
            height={p.logoH}
            className={`max-h-8 w-auto object-contain ${muted ? "grayscale hover:grayscale-0 transition-[filter]" : ""}`}
          />
        </a>
      ))}
      {showJoinTile && (
        <a
          href={PARTNER_JOIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 min-w-[120px] items-center justify-center rounded-xl border-2 border-dashed border-primary/35 bg-primary-tint-light px-5 text-label-md font-bold text-primary hover:border-primary hover:bg-primary-tint-soft transition-colors"
        >
          Join us
        </a>
      )}
    </div>
  );
}
