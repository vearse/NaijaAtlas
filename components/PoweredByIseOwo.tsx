"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const ATTENTION_INTERVAL_MS = 30000;
const ATTENTION_DURATION_MS = 3500;

export default function PoweredByIseOwo() {
  const [attention, setAttention] = useState(false);

  useEffect(() => {
    let timeout: number | undefined;
    const interval = window.setInterval(() => {
      setAttention(true);
      timeout = window.setTimeout(() => setAttention(false), ATTENTION_DURATION_MS);
    }, ATTENTION_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <Link
      href="https://iseowoapp.com?utm_source=naija-atlas"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by Ise Owo — visit iseowoapp.com"
      className={[
        "inline-flex items-center gap-2 rounded-lg px-2 md:px-3 py-1 md:py-1.5",
        "text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0",
        attention ? "animate-naija-attention bg-amber-50 ring-1 ring-amber-300" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Powered by
      </span>
      <Image
        src="/images/ise-owo-logo.png"
        alt="Ise Owo"
        width={88}
        height={24}
        className="h-4 md:h-6 w-auto object-contain"
        priority
      />
    </Link>
  );
}