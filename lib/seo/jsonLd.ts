import { siteConfig } from "@/lib/seo/site";

const { url, name, description, language } = siteConfig;

/** Schema.org graph for rich results (WebSite + WebApplication + Organization). */
export function buildRootJsonLd() {
  const organization = {
    "@type": "Organization" as const,
    "@id": `${url}/#organization`,
    name,
    url,
    description,
  };

  const webSite = {
    "@type": "WebSite" as const,
    "@id": `${url}/#website`,
    url,
    name,
    description,
    inLanguage: language,
    publisher: { "@id": `${url}/#organization` },
  };

  const webApplication = {
    "@type": "WebApplication" as const,
    "@id": `${url}/#webapp`,
    name,
    url,
    description,
    inLanguage: language,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Modern browser with WebGL for map.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
    featureList: [
      "Interactive map of Nigeria's 36 states and 774 LGAs",
      "Six geopolitical regions",
      "State comparison tools",
      "Tourist and investment map overlays",
      "Shareable deep links",
    ],
    publisher: { "@id": `${url}/#organization` },
    isPartOf: { "@id": `${url}/#website` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, webSite, webApplication],
  };
}
