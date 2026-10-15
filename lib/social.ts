/**
 * Social profile links used across the shared hub footer.
 *
 * `NAIJAATLAS_X_URL` is a placeholder until the live profile URL is supplied.
 * While it is not a real URL the footer omits the X link entirely rather than
 * guessing an address — replace the placeholder with the profile URL to switch
 * the link on.
 */
export const NAIJAATLAS_X_URL = "<PUT_THE_NAIJAATLAS_X_URL_HERE>";

/** The X profile URL, or `null` while the placeholder is still in place. */
export function naijaAtlasXUrl(): string | null {
  const url = NAIJAATLAS_X_URL.trim();
  return /^https?:\/\//i.test(url) ? url : null;
}
