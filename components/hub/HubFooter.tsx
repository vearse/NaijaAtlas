import Link from "next/link";

export default function HubFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6 text-body-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">NaijaAtlas</p>
          <p className="mt-1 max-w-sm">
            Open civic intelligence — states, LGAs, maps, and elections.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} NaijaAtlas</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/places" className="hover:text-[#008751]">Places</Link>
          <Link href="/explore" className="hover:text-[#008751]">Map</Link>
          <Link href="/explore?map=election" className="hover:text-[#008751]">
            Civic
          </Link>
          <Link href="/explore?map=ranking" className="hover:text-[#008751]">
            Data
          </Link>
        </div>
      </div>
    </footer>
  );
}
