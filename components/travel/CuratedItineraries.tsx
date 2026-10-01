"use client";

import { useState } from "react";
import Link from "next/link";

type Stop = {
  name: string;
  note: string;
  mapQuery: string;
};

type Day = {
  label: string;
  theme: string;
  title: string;
  stops: Stop[];
};

type Itinerary = {
  id: string;
  tag: string;
  duration: string;
  stopCount: number;
  title: string;
  days: Day[];
};

const ITINERARIES: Itinerary[] = [
  {
    id: "lagos-art-atlantic",
    tag: "Active itinerary",
    duration: "3 Days",
    stopCount: 12,
    title: "3 days in Lagos: Art, Atlantic & Island Sound",
    days: [
      {
        label: "Day 1",
        theme: "Island historic",
        title: "Heritage & Colonial Lagos",
        stops: [
          {
            name: "National Museum",
            note: "Onikan arts & antiquities",
            mapQuery: "museum-lagos",
          },
          {
            name: "Freedom Park",
            note: "Colonial prison converted garden",
            mapQuery: "freedom-park",
          },
          {
            name: "Lagos Island Market",
            note: "Balogun textile trading",
            mapQuery: "balogun",
          },
        ],
      },
      {
        label: "Day 2",
        theme: "Peninsula nature",
        title: "Lekki, Ikoyi & the Atlantic Front",
        stops: [
          {
            name: "Lekki Conservation Centre",
            note: "Canopy walk over the lagoon",
            mapQuery: "lekki-conservation",
          },
          {
            name: "Elegba Beach",
            note: "Open shoreline and fishing boats",
            mapQuery: "elegba-beach",
          },
          {
            name: "Nike Art Gallery",
            note: "Contemporary private collection",
            mapQuery: "nike-art",
          },
        ],
      },
      {
        label: "Day 3",
        theme: "Island sound",
        title: "Ikeja & the Festival Ground",
        stops: [
          {
            name: "New Afrika Shrine",
            note: "FESTAC '77 tower and amphitheatre",
            mapQuery: "new-afrika-shrine",
          },
          {
            name: "Olumo Rock",
            note: "Abeokuta granite outcrops",
            mapQuery: "olumo-rock",
          },
        ],
      },
    ],
  },
  {
    id: "plateau-highlands",
    tag: "Eco-expedition",
    duration: "4 Days",
    stopCount: 9,
    title: "Plateau highlands: Waterfalls, Shere Hills & Mist",
    days: [
      {
        label: "Day 1",
        theme: "Jos plateau",
        title: "Arrival & Shere Hills",
        stops: [
          {
            name: "Shere Hills",
            note: "Highest point, ~2,589m",
            mapQuery: "shere-hills",
          },
          {
            name: "Jos Museum",
            note: "Nok culture archaeology",
            mapQuery: "jos-museum",
          },
        ],
      },
      {
        label: "Day 2",
        theme: "Waterfalls",
        title: "Sausage Falls & the plateau country roads",
        stops: [
          {
            name: "Sausage Falls",
            note: "Rocky descent to the water",
            mapQuery: "sausage-falls",
          },
          {
            name: "Rin Falls",
            note: "Roadside falls on the Bauchi road",
            mapQuery: "rin-falls",
          },
        ],
      },
    ],
  },
  {
    id: "coast-and-creeks",
    tag: "Coastal trail",
    duration: "5 Days",
    stopCount: 11,
    title: "Coast and creeks: Historic Calabar & Mangrove Eco-Trails",
    days: [
      {
        label: "Day 1",
        theme: "Calabar",
        title: "Colonial Calabar and the museum",
        stops: [
          {
            name: "Calabar Museum",
            note: "Slavery and abolition history",
            mapQuery: "calabar-museum",
          },
          {
            name: "Slave History Museum, Akwa Akpa",
            note: "Ekpe village records",
            mapQuery: "akwa-akpa",
          },
        ],
      },
      {
        label: "Day 2",
        theme: "Estuary",
        title: "Mangrove creeks by boat",
        stops: [
          {
            name: "Akwa Falls",
            note: "Wide estuary and rapids",
            mapQuery: "akwa-falls",
          },
          {
            name: "Cross River National Park",
            note: "Rainforest and swamp forest",
            mapQuery: "cross-river-np",
          },
        ],
      },
    ],
  },
];

export default function CuratedItineraries() {
  const [openId, setOpenId] = useState<string>(ITINERARIES[0].id);

  return (
    <section className="space-y-6" id="itineraries">
      <div>
        <h2 className="font-landing-display text-headline-lg tracking-tight text-text-primary">
          Curated itineraries
        </h2>
        <p className="text-body-md text-text-secondary">
          Multi-day journeys with documented stops you can hand to the map.
        </p>
      </div>

      <div className="space-y-4">
        {ITINERARIES.map((itinerary) => {
          const open = openId === itinerary.id;
          return (
            <div
              key={itinerary.id}
              className={`rounded-2xl bg-surface-card p-5 shadow-sm transition-colors sm:p-6 ${
                open
                  ? "border-2 border-primary/40"
                  : "border border-border-subtle hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? "" : itinerary.id)}
                aria-expanded={open}
                className="flex w-full flex-col items-start justify-between gap-3 text-left sm:flex-row sm:items-center"
              >
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-label-caps text-label-caps ${
                        open
                          ? "bg-primary-tint-soft text-primary"
                          : "bg-slate-100 text-text-secondary"
                      }`}
                    >
                      {itinerary.tag}
                    </span>
                    <span className="text-body-sm text-text-muted">
                      {itinerary.duration} · {itinerary.stopCount} Stops
                    </span>
                  </div>
                  <h3
                    className={`${open ? "font-headline-md text-headline-md" : "font-headline-sm text-headline-sm"} text-text-primary`}
                  >
                    {itinerary.title}
                  </h3>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 font-label-md text-label-md ${
                    open ? "text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {open ? "Collapse" : "Expand"}
                  <span aria-hidden>{open ? "−" : "+"}</span>
                </span>
              </button>

              {open ? (
                <div className="grid grid-cols-1 gap-6 border-t border-border-subtle pt-6 md:grid-cols-3">
                  {itinerary.days.map((day) => (
                    <div
                      key={day.label}
                      className="space-y-4 rounded-xl border border-border-subtle bg-surface-base p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm font-bold text-text-primary">
                          {day.label}
                        </span>
                        <span className="font-label-caps text-label-caps text-text-muted">
                          {day.theme}
                        </span>
                      </div>
                      <h4 className="font-label-md text-label-md font-semibold text-primary">
                        {day.title}
                      </h4>
                      <div className="space-y-3 pt-2">
                        {day.stops.map((stop) => (
                          <div
                            key={stop.mapQuery}
                            className="flex items-start justify-between gap-3 text-body-sm"
                          >
                            <div>
                              <div className="font-semibold text-text-primary">
                                {stop.name}
                              </div>
                              <div className="text-xs text-text-muted">{stop.note}</div>
                            </div>
                            <Link
                              href={`/explore?map=minimal&stop=${stop.mapQuery}`}
                              className="flex shrink-0 items-center gap-0.5 text-xs text-primary hover:underline"
                            >
                              On map
                              <span aria-hidden>&nearr;</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}