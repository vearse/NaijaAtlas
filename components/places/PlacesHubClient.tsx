"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HubShell from "@/components/hub/HubShell";
import HubHeader from "@/components/hub/HubHeader";
import HubFooter from "@/components/hub/HubFooter";
import type { PlacesDirectoryData } from "@/lib/server/loadPlacesPageData";
import { regionShortCode } from "@/lib/landing/regionShortCode";

type Props = PlacesDirectoryData;

type BrowseMode = "states" | "lgas";

export default function PlacesHubClient(props: Props) {
  const [query, setQuery] = useState("");
  const [zoneId, setZoneId] = useState<string | "all">("all");
  const [browse, setBrowse] = useState<BrowseMode>("states");

  const filteredStates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.allStates.filter((s) => {
      if (zoneId !== "all" && s.regionId !== zoneId) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.capital?.toLowerCase().includes(q) ?? false) ||
        s.slug.includes(q)
      );
    });
  }, [props.allStates, query, zoneId]);

  const filteredLgas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || browse !== "lgas") return [];
    return props.lgas
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.stateName.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [props.lgas, query, browse]);

  const spotlight = props.allStates.find((s) => s.id === "NG-NI") ?? props.allStates[0];

  return (
    <HubShell>
      <HubHeader
        active="places"
        primaryCta={{ label: "Open map", href: "/explore?map=minimal" }}
      />

      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-slate-200 py-2.5">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-2 text-body-sm text-slate-500">
          <nav className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#008751]">Home</Link>
            <span aria-hidden>/</span>
            <span className="text-slate-900 font-medium">Places</span>
          </nav>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 pb-16">
        <section className="pt-12 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-label-caps mb-4">
            <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
            PLACES AND LAND
          </div>
          <h1 className="font-landing-display text-display-hero-mobile md:text-display-hero text-slate-900 tracking-tight max-w-3xl">
            Explore Nigeria&apos;s places.
          </h1>
          <p className="text-body-lg text-slate-600 max-w-2xl mt-4">
            {props.stateCount} states, FCT, {props.lgaCount.toLocaleString()} LGAs,
            and the land between them. Search the directory or open a state profile.
          </p>

          <div className="mt-8 max-w-2xl">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search states, capitals, LGAs…"
                className="w-full pl-4 pr-4 py-3.5 bg-white border border-slate-200 rounded-full text-body-md focus:outline-none focus:border-[#008751] focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-label-caps text-slate-400 tracking-wider">
                BROWSE BY
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                {(["states", "lgas"] as BrowseMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBrowse(mode)}
                    className={`px-4 py-1.5 rounded-lg text-label-md capitalize ${
                      browse === mode
                        ? "bg-white text-[#008751] font-semibold shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 border-y border-slate-200/80 bg-gradient-to-b from-lime-50/40 to-transparent rounded-3xl px-4 md:px-6 mb-12">
          <h2 className="font-landing-display text-headline-lg text-slate-900">
            State spotlight
          </h2>
          {spotlight && (
            <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl">
              <p className="text-label-caps text-[#008751]">Featured</p>
              <h3 className="text-headline-md font-bold mt-1">{spotlight.name}</h3>
              <p className="text-body-sm text-slate-600 mt-2">
                Capital {spotlight.capital ?? "—"} · {spotlight.lgaCount} LGAs ·{" "}
                {spotlight.pollingUnitCount.toLocaleString()} polling units
              </p>
              <Link
                href={`/places/${spotlight.slug}`}
                className="inline-flex mt-4 text-label-md font-semibold text-[#008751] hover:underline"
              >
                Open {spotlight.name} profile →
              </Link>
            </div>
          )}
        </section>

        <section id="browse" className="scroll-mt-28">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setZoneId("all")}
              className={`px-4 py-2 rounded-full text-label-md ${
                zoneId === "all"
                  ? "bg-[#008751] text-white font-semibold"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              All zones
            </button>
            {props.regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setZoneId(r.id)}
                className={`px-4 py-2 rounded-full text-label-md ${
                  zoneId === r.id
                    ? "bg-[#008751] text-white font-semibold"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {browse === "lgas" && query.trim() && filteredLgas.length > 0 && (
            <ul className="mb-8 grid sm:grid-cols-2 gap-2">
              {filteredLgas.map((l) => {
                const state = props.allStates.find((s) => s.id === l.parentId);
                return (
                  <li key={l.id}>
                    <Link
                      href={state ? `/places/${state.slug}` : "/places"}
                      className="block p-3 rounded-xl bg-white border border-slate-200 hover:border-[#008751]/40"
                    >
                      <span className="font-medium">{l.name}</span>
                      <span className="text-body-sm text-slate-500 block">
                        {l.stateName}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-slate-50 text-label-caps text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Capital</th>
                  <th className="px-4 py-3">LGAs</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Polling units</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.capital ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{s.lgaCount}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {regionShortCode(s.regionId)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {s.pollingUnitCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/places/${s.slug}`}
                        className="text-[#008751] font-semibold hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="land" className="scroll-mt-28 mt-20">
          <h2 className="font-landing-display text-headline-lg text-slate-900">
            Explore the land
          </h2>
          <p className="text-body-md text-slate-600 mt-2 max-w-2xl">
            Nigeria at 923,768 km² — six geopolitical zones, coast on the Gulf of
            Guinea, and major rivers and plateaus. Full Land hub maps are coming;
            use the atlas for terrain and zones today.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {props.regions.map((r) => (
              <Link
                key={r.id}
                href={`/places?zone=${r.id.replace("NG-", "")}`}
                onClick={(e) => {
                  e.preventDefault();
                  setZoneId(r.id);
                  document.getElementById("browse")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-shadow"
              >
                <span className="text-label-caps text-slate-400">
                  {regionShortCode(r.id)} · {r.stateNames.length} states
                </span>
                <h3 className="text-headline-sm font-bold mt-1">{r.name}</h3>
                <p className="text-body-sm text-slate-600 mt-2 line-clamp-2">
                  {r.stateNames.slice(0, 4).join(", ")}
                  {r.stateNames.length > 4 ? "…" : ""}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex h-11 items-center px-5 rounded-xl bg-[#008751] text-white font-label-md"
            >
              Go to physical map
            </Link>
            <Link
              href="/explore?map=minimal"
              className="inline-flex h-11 items-center px-5 rounded-xl border border-[#008751] text-[#008751] font-label-md"
            >
              Zones on map
            </Link>
          </div>
        </section>
      </main>

      <HubFooter />
    </HubShell>
  );
}
