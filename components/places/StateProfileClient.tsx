"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import StatePickerMiniMap from "@/components/places/StatePickerMiniMap";
import StateLgaSvg from "@/components/places/StateLgaSvg";
import type { StateLgaSvg as StateLgaSvgData } from "@/lib/server/stateLgaSvg";
import StateOverviewPanel from "@/components/places/StateOverviewPanel";
import ProfileSynthesis from "@/components/places/profile/ProfileSynthesis";
import ProfileLgaSection from "@/components/places/profile/ProfileLgaSection";
import ProfileLandSection from "@/components/places/profile/ProfileLandSection";
import ProfilePeopleSection from "@/components/places/profile/ProfilePeopleSection";
import ProfileTravelSection from "@/components/places/profile/ProfileTravelSection";
import ProfileCivicSection from "@/components/places/profile/ProfileCivicSection";
import ProfileEconomySection from "@/components/places/profile/ProfileEconomySection";
import ProfileDataSection from "@/components/places/profile/ProfileDataSection";
import type { StateProfileData } from "@/lib/server/loadPlacesPageData";
import {
  formatNaira,
  formatNumber,
  formatPopulation,
} from "@/lib/places/formatters";
import {
  IconArrow,
  IconChevronRight,
  IconLandmark,
  IconMap,
  IconWater,
} from "@/components/landing/icons";

type Props = StateProfileData & { lgaSvg?: StateLgaSvgData | null };

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
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(
    props.lgas[0]?.id ?? null
  );

  useEffect(() => {
    if (!selectedLgaId) return;
    document.getElementById("lgas")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedLgaId]);

  /* The reference profile is one long page with #land, #people, #civic anchors.
     The tabbed shell keeps the same anchors by syncing them both ways, so
     /places/lagos#economy deep-links into a tab and the browser back button
     steps between sections. */
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace("#", "") as TabId;
      if (TABS.some((t) => t.id === id)) setTab(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectTab = (id: TabId) => {
    setTab(id);
    if (typeof window !== "undefined" && window.location.hash !== `#${id}`) {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const { state, content, facts, igr } = props;
  const sid = state.id;

  const mapLinks = useMemo(
    () => [
      { label: "Election map", href: `/civic/map/elections?states=${sid}` },
      { label: "Travel map", href: `/travel/map?states=${sid}` },
      { label: "Rankings map", href: `/data/map/rankings` },
      { label: "Places & Land map", href: `/places/map?states=${sid}&lgas=1` },
      { label: "Economy map", href: `/economy/map?states=${sid}` },
    ],
    [sid]
  );

  /** Sibling states in the same zone, for the "compare around the region" rail. */
  const zoneSiblings = useMemo(
    () =>
      props.allStates
        .filter((s) => s.regionId === state.regionId && s.id !== sid)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [props.allStates, state.regionId, sid]
  );

  const stats = [
    { label: "Capital", value: content.capital ?? "—" },
    {
      label: "Population",
      value: formatPopulation(facts.population) ?? "—",
      note: facts.populationYear ? `${facts.populationYear} estimate` : undefined,
    },
    {
      label: "Land area",
      value: facts.landAreaKm2 ? `${formatNumber(facts.landAreaKm2)} km²` : "—",
    },
    { label: "LGAs", value: formatNumber(state.lgaCount) },
    {
      label: "Senate seats",
      value: props.senateSeatCount ? String(props.senateSeatCount) : "—",
    },
    {
      label: "IGR (2024)",
      value: formatNaira(igr) ?? "—",
      note: igr ? "internally generated revenue" : "not published",
    },
  ];

  return (
    <HubShell>
      <HubHeader
        primaryCta={{
          label: "Open on map",
          href: `/places/map?states=${sid}`,
        }}
      />

      {/* Section bar, matching the Places hub. */}
      <div className="sticky top-16 z-40 bg-surface-card/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-1.5 text-label-md text-text-muted shrink-0"
          >
            <Link href="/" className="hover:text-primary font-semibold">
              Home
            </Link>
            <IconChevronRight className="w-3.5 h-3.5" />
            <Link href="/places" className="hover:text-primary font-semibold">
              Places
            </Link>
            <IconChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary font-bold">{state.name}</span>
          </nav>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                aria-current={tab === t.id ? "true" : undefined}
                className={`px-3 py-1.5 rounded-full text-label-md whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-primary-container text-white font-bold"
                    : "bg-slate-100 text-text-secondary hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link
            href="/places"
            className="ml-auto hidden sm:inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-lg bg-[#043828] text-white text-label-md font-bold hover:bg-[#065a41]"
          >
            All states
            <IconArrow />
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-16">
        {tab === "overview" && (
          <>
            {/* Hero band */}
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-sm">
              <div className="grid grid-cols-1 items-center gap-8 p-6 md:p-8 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint-light px-3 py-1.5 text-label-caps uppercase text-primary">
                      <IconMap className="h-3.5 w-3.5" />
                      {content.region}
                    </span>
                    {props.insights?.general.nickname ? (
                      <span className="inline-flex items-center rounded-full border border-border-subtle px-3 py-1.5 text-label-caps uppercase text-text-muted">
                        {props.insights.general.nickname}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-4 font-landing-display text-display-lg text-text-primary">
                    {state.name} State
                  </h1>
                  <p className="mt-3 max-w-xl text-body-lg text-text-secondary">
                    {content.description}
                  </p>

                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    {[
                      { term: "Capital", value: content.capital ?? "—" },
                      { term: "Population", value: formatPopulation(facts.population) ?? "—" },
                      { term: "Total area", value: facts.landAreaKm2 ? `${formatNumber(facts.landAreaKm2)} km²` : "—" },
                      { term: "LGAs", value: formatNumber(state.lgaCount) },
                      {
                        term: "House Reps (total)",
                        value: props.houseRepSeatCount
                          ? String(props.houseRepSeatCount)
                          : "—",
                      },
                      { term: "IGR (2024)", value: formatNaira(igr) ?? "—" },
                    ].map((chip) => (
                      <div key={chip.term}>
                        <dt className="text-label-caps uppercase text-text-muted">{chip.term}</dt>
                        <dd className="font-display text-headline-sm font-bold tabular-nums text-text-primary">
                          {chip.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/places?compare=${[sid, zoneSiblings[0]?.id].filter(Boolean).join(",")}#compare`}
                      className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-5 py-2.5 text-label-md font-bold text-text-primary transition-colors hover:border-primary-container/50"
                    >
                      Compare with {zoneSiblings[0]?.name ?? "another state"}
                      <IconArrow />
                    </Link>
                    <Link
                      href={`/places/map?states=${sid}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-label-md font-bold text-white transition-colors hover:bg-primary"
                    >
                      <IconMap />
                      Open on Places map
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  {props.lgaSvg ? (
                    <StateLgaSvg
                      data={props.lgaSvg}
                      stateId={state.id}
                      stateName={state.name}
                      selectedId={selectedLgaId}
                      onSelect={(id) => setSelectedLgaId(id)}
                      className="aspect-[4/3] min-h-[240px] w-full overflow-hidden rounded-2xl border border-border-subtle"
                    />
                  ) : (
                    <StatePickerMiniMap
                      selectedStateId={state.id}
                      slugByStateId={props.slugByStateId}
                      className="aspect-[4/3] min-h-[240px] w-full overflow-hidden rounded-2xl border border-border-subtle"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Facts */}
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-surface-card border border-border-subtle p-4"
                >
                  <dt className="text-label-caps text-slate-400 font-bold uppercase tracking-wider">
                    {stat.label}
                  </dt>
                  <dd className="font-landing-display text-headline-md text-text-primary tabular-nums leading-tight mt-0.5">
                    {stat.value}
                  </dd>
                  {stat.note && (
                    <dd className="text-[10px] text-slate-400 leading-tight">
                      {stat.note}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            
            <div className="mt-12">
              <ProfileLgaSection
                lgas={props.lgas}
                selectedId={selectedLgaId}
                onSelect={setSelectedLgaId}
                query={lgaQuery}
                onQueryChange={setLgaQuery}
                stateId={sid}
                stateName={state.name}
                regionName={state.regionName}
                stateAreaKm2={facts.landAreaKm2}
              />
            </div>

            <ProfileSynthesis
              insights={props.insights}
              content={content}
              stateName={state.name}
              stateId={sid}
            />

            {props.overview && (
              <section
                id="state-overview"
                className="mt-12 rounded-3xl border border-border-subtle bg-surface-card p-6"
              >
                <span className="block text-label-caps uppercase tracking-widest text-primary">
                  State overview
                </span>
                <h2 className="mt-1 font-landing-display text-headline-lg text-text-primary">
                  Languages, stories and places to explore
                </h2>
                <div className="mt-5">
                  <StateOverviewPanel overview={props.overview} variant="full" />
                </div>
              </section>
            )}

            <div className="mt-12 grid grid-cols-1 gap-8 items-start lg:grid-cols-12">
              <aside className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
                  <h2 className="font-landing-display text-headline-md text-text-primary">
                    Open on map
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mapLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle bg-surface-card text-label-md text-primary font-bold hover:border-primary-container/50"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {props.landFeatures.length > 0 && (
                  <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
                    <h2 className="font-landing-display text-headline-md text-text-primary">
                      Land &amp; waters
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {props.landFeatures.map((f) => (
                        <li key={f.id}>
                          <Link
                            href={f.exploreHref}
                            className="flex items-center gap-3 rounded-xl bg-slate-50 border border-border-subtle px-3.5 py-3 hover:border-primary-container/40"
                          >
                            <span
                              className={
                                f.tone === "sky"
                                  ? "text-sky-600 shrink-0"
                                  : "text-lime-600 shrink-0"
                              }
                            >
                              {f.tone === "sky" ? <IconWater /> : <IconLandmark />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-label-md font-bold text-text-primary truncate">
                                {f.name}
                              </span>
                              <span className="block text-[11px] text-text-muted truncate">
                                {f.metric} · {f.badge}
                              </span>
                            </span>
                            <IconChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </aside>

              <div className="lg:col-span-5 space-y-6">
                {zoneSiblings.length > 0 && (
                  <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
                    <h2 className="font-landing-display text-headline-md text-text-primary">
                      Elsewhere in {content.region}
                    </h2>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {zoneSiblings.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/places/${s.slug}`}
                            className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 text-label-md font-semibold text-slate-700 hover:bg-primary-container hover:text-white transition-colors"
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "land" && (
          <ProfileLandSection
            insights={props.insights}
            landFeatures={props.landFeatures}
            stateName={state.name}
            stateId={sid}
          />
        )}

        {tab === "people" && (
          <ProfilePeopleSection
            insights={props.insights}
            content={content}
            stateName={state.name}
            stateId={sid}
          />
        )}

        {tab === "travel" && (
          <ProfileTravelSection
            insights={props.insights}
            festivals={props.festivals}
            landFeatures={props.landFeatures}
            stateName={state.name}
            stateId={sid}
          />
        )}

        {tab === "civic" && (
          <ProfileCivicSection
            insights={props.insights}
            stateName={state.name}
            stateId={sid}
            lgaCount={state.lgaCount}
            pollingUnitCount={state.pollingUnitCount ?? 0}
            senateSeatCount={props.senateSeatCount}
          />
        )}

        {tab === "economy" && (
          <ProfileEconomySection
            insights={props.insights}
            stateName={state.name}
            stateId={sid}
          />
        )}

        {tab === "data" && (
          <ProfileDataSection
            insights={props.insights}
            compareGroups={props.compareGroups}
            allStates={props.allStates}
            currentState={state}
            stateName={state.name}
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
    <div className="max-w-2xl py-6">
      <span className="text-label-caps text-primary tracking-widest uppercase block mb-1">
        State profile
      </span>
      <h2 className="font-landing-display text-headline-lg text-text-primary">
        {title}
      </h2>
      <p className="text-body-md text-text-secondary mt-3">{body}</p>
      {extra && <p className="text-body-sm text-text-muted mt-2">{extra}</p>}
      <Link
        href={cta.href}
        className="inline-flex mt-6 items-center gap-2 h-11 px-5 rounded-xl bg-primary-container text-white font-label-md font-bold hover:bg-[#006d40]"
      >
        {cta.label}
        <IconArrow />
      </Link>
    </div>
  );
}
