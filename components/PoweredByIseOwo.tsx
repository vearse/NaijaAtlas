import Image from "next/image";
import Link from "next/link";

export default function PoweredByIseOwo() {
  return (
    <Link
      href="https://iseowoapp.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
      aria-label="Powered by Ise Owo — visit iseowoapp.com"
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Powered by
      </span>
      <Image
        src="/images/ise-owo-logo.png"
        alt="Ise Owo"
        width={88}
        height={24}
        className="h-5 w-auto object-contain"
        priority
      />
    </Link>
  );
}
