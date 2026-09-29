import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-10 max-w-7xl mx-auto gap-6">
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-landing-display text-headline-md font-black text-slate-900">
              NaijaAtlas
            </span>
          </div>
          <p className="text-body-sm text-slate-600 text-center md:text-left max-w-sm">
            Explore, discover, and reimagine Nigeria with data and maps. Open
            civic intelligence for citizens, journalists, and diaspora.
          </p>
          <p className="text-body-sm text-on-surface-variant">
            © {new Date().getFullYear()} NaijaAtlas
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/explore"
            className="text-primary font-semibold text-label-md hover:text-primary-fixed"
          >
            Open map
          </Link>
          <Link
            href="/explore?map=ranking"
            className="text-on-surface-variant hover:text-primary text-label-md"
          >
            Rankings
          </Link>
          <Link
            href="/explore?map=election"
            className="text-on-surface-variant hover:text-primary text-label-md"
          >
            Elections
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-body-sm text-on-surface-variant">
            Made in Nigeria 🇳🇬
          </span>
          <span className="w-2 h-2 rounded-full bg-primary" aria-hidden />
        </div>
      </div>
    </footer>
  );
}
