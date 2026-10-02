import PartnerLogosRow from "@/components/brand/PartnerLogosRow";

export default function SponsorsBand() {
  return (
    <section className="pt-14" aria-labelledby="sponsors-title">
      <p className="text-label-caps uppercase text-text-muted text-center md:text-left">
        Sponsored by
      </p>
      <h2
        id="sponsors-title"
        className="font-landing-display text-headline-lg text-text-primary mt-1 text-center md:text-left"
      >
        The partners keeping NaijaAtlas free
      </h2>
      <div className="mt-8 rounded-2xl border border-border-subtle bg-primary-tint-light/40 px-6 py-8 md:px-10">
        <PartnerLogosRow showJoinTile />
      </div>
    </section>
  );
}
