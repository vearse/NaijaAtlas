import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md";
  showWordmark?: boolean;
  wordmarkClassName?: string;
  tagline?: string;
  className?: string;
};

export default function NaijaAtlasMark({
  href = "/",
  size = "md",
  showWordmark = true,
  wordmarkClassName = "font-landing-display text-headline-sm font-extrabold text-primary tracking-tight",
  tagline,
  className = "",
}: Props) {
  const box =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : "w-9 h-9 rounded-lg group-hover:scale-105 transition-transform duration-150";

  const inner = (
    <>
      <Image
        src="/logo.jpeg"
        alt="NaijaAtlas"
        width={36}
        height={36}
        className={`${box} object-cover shadow-sm border border-emerald-600/25 shrink-0`}
        priority
      />
      {showWordmark && (
        <span className="flex flex-col min-w-0">
          <span className={wordmarkClassName}>NaijaAtlas</span>
          {tagline && (
            <span className="hidden lg:inline text-[10px] text-text-muted font-medium tracking-tight -mt-0.5 truncate">
              {tagline}
            </span>
          )}
        </span>
      )}
    </>
  );

  const wrapClass = `flex items-center gap-3 shrink-0 group ${className}`;

  if (href) {
    return (
      <Link href={href} className={wrapClass}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapClass}>{inner}</div>;
}
