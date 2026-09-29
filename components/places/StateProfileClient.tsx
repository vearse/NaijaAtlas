"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import StatePickerMiniMap from "@/components/places/StatePickerMiniMap";
import type { StateProfileData } from "@/lib/server/loadPlacesPageData";
import { regionShortCode } from "@/lib/landing/regionShortCode";

type Props = StateProfileData;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "land", label: "Land" },
  { id: "people", label: "People" },
  { id: "travel", label: "Travel" },
  { id: "civic", label: "Civic" },
  { id: "economy", label: "Economy" },
  { id: "data", label: "Data" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function StateProfileClient(props: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [lgaQuery, setLgaQuery] = useState("");

  const { state, content } = props;
  const sid = state.id;

  const mapLinks = useMemo(
    () => [
      {
        label: "Election map",
        href: `/explore?map=election&states=${sid}`,
      },
      {
        label: "Travel map",
        href: `/explore?lens=tourist&states=${sid}`,
      },
      {
        label: "Rankings map",
        href: `/explore?map=ranking`,
      },
      {
        label: "Physical map",
        href: `/explore?map=minimal&states=${sid}`,
      },
    ],
    [sid]
  );

  const filteredLgas = useMemo(() => {
    const q = lgaQuery.trim().toLowerCase();
    if (!q) return props.lgas;
    return props.lgas.filter((l) => l.name.toLowerCase().includes(q));
  }, [props.lgas, lgaQuery]);

  return (
    <HubShell>
      <HubHeader
        active="places"
        primaryCta={{
          label: "Open on map",
          href: `/explore?map=minimal&states=${sid}`,
        }}
      />

      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-2 text-body-sm text-slate-500 flex flex-wrap gap-1">
          <Link href="/places" className="hover:text-[#008751]">Places</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{state.name}</span>
        </div>
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max border-t border-slate-100 pt-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-label-md rounded-t-lg border-b-2 -mb-px ${
                  tab === t.id
                    ? "border-[#008751] text-[#008751] font-semibold bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 pb-16">
        {tab === "overview" && (
          <>
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <p className="text-label-caps text-[#008751] tracking-widest">
                  {content.region} · {regionShortCode(state.regionId)}
                </p>
                <h1 className="font-landing-display text-headline-xl md:text-display-hero-mobile text-slate-900 mt-2">
                  {state.name}
                </h1>
                <p className="text-body-lg text-slate-600 mt-4">{content.description}</p>

                <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Capital", value: content.capital ?? "—" },
                    { label: "LGAs", value: String(state.lgaCount) },
                    {
                      label: "Polling units",
                      value: (state.pollingUnitCount ?? 0).toLocaleString(),
                    },
                    {
                      label: "Senate seats",
                      value: String(props.senateSeatCount || "—"),
                    },
                    { label: "Region", value: content.region },
                    { label: "Code", value: state.id.replace("NG-", "") },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-white border border-slate-200 p-3"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {stat.label}
                      </dt>
                      <dd className="text-sm font-semibold text-slate-900 mt-0.5">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8">
                  <p className="text-label-md font-semibold text-slate-900 mb-3">
                    Open on map
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mapLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-label-md text-[#008751] font-medium hover:border-[#008751]/50"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <StatePickerMiniMap
                selectedStateId={state.id}
                slugByStateId={props.slugByStateId}
                className="aspect-[4/3] min-h-[280px] w-full"
              />
            </div>

            <section className="mt-14">
              <h2 className="font-landing-display text-headline-md text-slate-900">
                Local government areas
              </h2>
              <input
                type="search"
                value={lgaQuery}
                onChange={(e) => setLgaQuery(e.target.value)}
                placeholder="Filter LGAs…"
                className="mt-4 w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200"
              />
              <ul className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredLgas.map((lga) => (
                  <li key={lga.id}>
                    <Link
                      href={`/explore?map=minimal&states=${sid}&lgas=1&lga=${lga.id}`}
                      className="block px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-[#008751]/30 text-body-sm"
                    >
                      {lga.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-body-sm text-slate-500 mt-3">
                Per-LGA profile URLs are coming soon — use the map links above for
                now.
              </p>
            </section>

            {content.languages.length > 0 && (
              <section className="mt-10">
                <h2 className="font-landing-display text-headline-md text-slate-900">
                  Languages
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {content.languages.map((lang) => (
                    <li key={lang.name}>
                      <a
                        href={lang.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full bg-slate-100 text-body-sm hover:bg-emerald-50"
                      >
                        {lang.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {tab === "land" && (
          <SectionTeaser
            title="Land & terrain"
            body="Relief, rivers, lakes, and coast for this state — use the physical map workspace."
            cta={{ label: "View on physical map", href: `/explore?map=minimal&states=${sid}` }}
          />
        )}
        {tab === "people" && (
          <SectionTeaser
            title="People & culture"
            body="Ethnic homelands and cultural notes are in the People lens on the atlas."
            cta={{ label: "Open People lens", href: `/explore?states=${sid}` }}
          />
        )}
        {tab === "travel" && (
          <SectionTeaser
            title="Travel & heritage"
            body="Destinations, parks, and tours — tourist lens on the map."
            cta={{
              label: "View on travel map",
              href: `/explore?lens=tourist&states=${sid}`,
            }}
          />
        )}
        {tab === "civic" && (
          <SectionTeaser
            title="Civic & elections"
            body={`Senate districts, constituencies, and polling units for ${state.name}.`}
            cta={{
              label: "View on election map",
              href: `/explore?map=election&states=${sid}`,
            }}
            extra={
              props.senateSeatCount > 0
                ? `${props.senateSeatCount} senatorial district(s) in ${state.name}.`
                : undefined
            }
          />
        )}
        {tab === "economy" && (
          <SectionTeaser
            title="Economy"
            body="Minerals, ports, and power projects — explore via the invest lens."
            cta={{
              label: "View on economy map",
              href: `/explore?lens=invest&states=${sid}`,
            }}
          />
        )}
        {tab === "data" && (
          <SectionTeaser
            title="Data & rankings"
            body="Compare indicators and rank states — full Data hub charts coming soon."
            cta={{
              label: "Open rankings map",
              href: `/explore?map=ranking`,
            }}
          />
        )}
      </main>

      <HubFooter />
    </HubShell>
  );
}

function SectionTeaser({
  title,
  body,
  cta,
  extra,
}: {
  title: string;
  body: string;
  cta: { label: string; href: string };
  extra?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-landing-display text-headline-lg text-slate-900">{title}</h2>
      <p className="text-body-md text-slate-600 mt-3">{body}</p>
      {extra && <p className="text-body-sm text-slate-500 mt-2">{extra}</p>}
      <Link
        href={cta.href}
        className="inline-flex mt-6 h-11 items-center px-5 rounded-xl bg-[#008751] text-white font-label-md"
      >
        {cta.label}
      </Link>
    </div>
  );
}
