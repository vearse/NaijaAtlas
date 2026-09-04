/** Parse a Wikipedia article title from a standard /wiki/ URL. */
export function wikiTitleFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("wikipedia.org")) return null;
    const match = parsed.pathname.match(/\/wiki\/(.+)$/);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1].replace(/_/g, " "));
  } catch {
    return null;
  }
}

export interface WikipediaArticle {
  title: string;
  pageUrl: string;
  html: string;
}

/** Upgrade protocol-relative URLs so srcdoc iframes load assets reliably. */
function normalizeWikiHtml(html: string): string {
  return html.replace(/\b(href|src|content)="\/\//g, '$1="https://');
}

function titleFromHtml(html: string, fallback: string): string {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

/** Fetch the full Wikipedia article HTML (same page as the wiki URL). */
export async function fetchWikipediaArticle(
  wikiUrl: string
): Promise<WikipediaArticle> {
  const title = wikiTitleFromUrl(wikiUrl);
  if (!title) throw new Error("Invalid Wikipedia URL");

  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/mobile-html/${encoded}`,
    { headers: { Accept: "text/html" } }
  );
  if (!res.ok) {
    throw new Error(`Wikipedia request failed (${res.status})`);
  }

  const raw = await res.text();
  if (!raw.trim()) {
    throw new Error("No article content found");
  }

  return {
    title: titleFromHtml(raw, title),
    pageUrl: wikiUrl,
    html: normalizeWikiHtml(raw),
  };
}
