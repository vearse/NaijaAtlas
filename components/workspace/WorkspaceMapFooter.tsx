import Link from "next/link";

export default function WorkspaceMapFooter() {
  return (
    <footer className="shrink-0 border-t border-border-subtle bg-surface-card py-6 px-6">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between gap-4 text-body-sm text-text-muted">
        <div>
          <p className="font-semibold text-text-primary">NaijaAtlas</p>
          <p className="mt-1">© {new Date().getFullYear()} · Open civic intelligence</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/places" className="hover:text-primary">Places</Link>
          <Link href="/data/map/rankings" className="hover:text-primary">
            Data methodology
          </Link>
          <Link href="/civic/map/elections" className="hover:text-primary">
            INEC sources
          </Link>
        </div>
      </div>
    </footer>
  );
}
