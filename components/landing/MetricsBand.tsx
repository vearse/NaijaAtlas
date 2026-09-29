type Props = {
  lgaCount: number;
  totalPollingUnits: number;
  ethnicGroupCount: number;
};

export default function MetricsBand({
  lgaCount,
  totalPollingUnits,
  ethnicGroupCount,
}: Props) {
  const items = [
    {
      value: "36 + 1",
      title: "Federating Units",
      sub: "36 States + Federal Capital",
    },
    {
      value: String(lgaCount),
      title: "Local Government Areas",
      sub: "Constitutional grassroots tiers",
    },
    {
      value: totalPollingUnits.toLocaleString("en-NG"),
      title: "Polling Units",
      sub: "Geocoded voting stations",
    },
    {
      value: String(ethnicGroupCount),
      title: "Ethnic Homelands",
      sub: "Documented cultural groups",
    },
  ];

  return (
    <section className="mt-28 py-12 px-6 md:px-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-xl relative overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/40">
        {items.map((item, i) => (
          <div
            key={item.title}
            className={`flex flex-col items-center text-center px-4 ${
              i > 0 ? "pt-6 lg:pt-0" : ""
            }`}
          >
            <span
              className="font-landing-display text-headline-xl lg:text-[48px] text-primary tracking-tight leading-none mb-2 tabular-nums"
            >
              {item.value}
            </span>
            <span className="text-body-md text-on-surface font-semibold">
              {item.title}
            </span>
            <span className="text-body-sm text-on-surface-variant">
              {item.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
