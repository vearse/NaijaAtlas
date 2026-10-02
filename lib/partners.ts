export type Partner = {
  name: string;
  href: string;
  logo: string;
  logoW: number;
  logoH: number;
};

export const PARTNERS: Partner[] = [
  {
    name: "Ise Owo",
    href: "https://iseowoapp.com?utm_source=naija-atlas",
    logo: "/images/ise-owo-logo.png",
    logoW: 132,
    logoH: 36,
  },
  {
    name: "KassleFlow",
    href: "https://kassleflow.com/?utm_source=naija-atlas",
    logo: "/images/kassleflow-logo.svg",
    logoW: 156,
    logoH: 40,
  },
];

export const PARTNER_JOIN_URL = "https://wa.me/2348056657860";
