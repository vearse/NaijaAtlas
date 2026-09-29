import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../landing.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-landing-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-landing-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${plusJakarta.variable} ${inter.variable} font-landing min-h-screen bg-[#f8fafc] text-slate-900`}
    >
      {children}
    </div>
  );
}
