/** INEC delimitation: SS/LL/WW/PPP (PU segment is 3 digits in the index). */

export function normalizeDelimitation(input: string): string | null {
  const cleaned = input.trim().replace(/-/g, "/").replace(/\s+/g, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return [
    String(nums[0]).padStart(2, "0"),
    String(nums[1]).padStart(2, "0"),
    String(nums[2]).padStart(2, "0"),
    String(nums[3]).padStart(3, "0"),
  ].join("/");
}

export function formatDelimitationDisplay(normalizedSlash: string): string {
  return normalizedSlash.replace(/\//g, "-");
}

/** Live input: digits only, auto-insert `-` after each 2-digit block (PU block up to 3 digits). */
export function formatDelimitationInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (!digits.length) return "";

  const seg1 = digits.slice(0, 2);
  const seg2 = digits.length > 2 ? digits.slice(2, 4) : "";
  const seg3 = digits.length > 4 ? digits.slice(4, 6) : "";
  const seg4 = digits.length > 6 ? digits.slice(6, 9) : "";

  const parts = [seg1];
  if (seg2) parts.push(seg2);
  if (seg3) parts.push(seg3);
  if (seg4) parts.push(seg4);
  return parts.join("-");
}

export function isDelimitationFormat(input: string): boolean {
  return normalizeDelimitation(input) !== null;
}
