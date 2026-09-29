"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PollingFinderCta() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const locate = () => {
    const q = query.trim();
    const base = "/explore?map=election";
    router.push(q ? `${base}&vin=${encodeURIComponent(q)}` : base);
  };

  return (
    <section
      id="polling-finder"
      className="mt-24 p-6 md:p-8 rounded-2xl bg-surface-container-high border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl scroll-mt-24"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shrink-0 mt-1"
          aria-hidden
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="12" cy="10" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <span className="text-label-caps text-primary tracking-widest uppercase">
            Instant delimitation
          </span>
          <h3 className="font-landing-display text-headline-md text-on-surface mt-1">
            Need to verify your polling station for 2027?
          </h3>
          <p className="text-body-md text-on-surface-variant max-w-xl mt-1">
            Input your voter card VIN or state and LGA to reveal the street
            address, registration volume, and past election turnouts on the
            electoral map.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && locate()}
          placeholder="Enter VIN or State..."
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-outline w-full md:w-64 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={locate}
          className="bg-primary-container hover:bg-inverse-primary text-on-primary-container font-label-md px-6 py-3 rounded-xl whitespace-nowrap shadow-md transition-all active:scale-95"
        >
          Locate unit
        </button>
      </div>
    </section>
  );
}
