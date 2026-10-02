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

/** Canonical /wiki/ URL for a known article title. */
export function wikipediaUrlForTitle(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(
    title.trim().replace(/ /g, "_")
  )}`;
}

/**
 * Best-matching article title for a free-text name.
 *
 * Catalogue names are often descriptive ("Aguleri Festival", "Oke-Ogun") rather
 * than exact article titles, so a search beats guessing a /wiki/ path.
 */
export async function searchWikipediaTitle(query: string): Promise<string | null> {
  const q = query.trim();
  if (!q) return null;

  const res = await fetch(
    `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
      q
    )}&limit=1`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;

  const data = (await res.json()) as { pages?: { title?: string }[] | null };
  const title = data.pages?.[0]?.title;
  return typeof title === "string" && title ? title : null;
}

/** Resolve a free-text name to a /wiki/ URL, or `null` when nothing matches. */
export async function resolveWikipediaUrl(query: string): Promise<string | null> {
  const title = await searchWikipediaTitle(query);
  return title ? wikipediaUrlForTitle(title) : null;
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