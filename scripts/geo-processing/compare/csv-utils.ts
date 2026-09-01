import fs from "fs";

/** Minimal RFC4180-style CSV parser (no quoted-field escapes beyond doubled quotes). */
export function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h.trim()] = (cells[j] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function readCsvFile(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, "utf-8"));
}

export function dashOr(value: string | undefined | null): string {
  if (value === undefined || value === null || value.trim() === "") return "—";
  return value.trim();
}

export function nullOrNumber(value: string | undefined | null): number | null {
  if (!value || value.trim() === "" || value.trim() === "—") return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function personOrDash(
  name: string | undefined | null,
  party?: string | null,
  imageUrl?: string | null,
  role?: string | null
) {
  const n = name?.trim();
  if (!n || n === "—") {
    return { name: "—", party: null, imageUrl: null, role: role ?? null };
  }
  return {
    name: n,
    party: party?.trim() || null,
    imageUrl: imageUrl?.trim() || null,
    role: role?.trim() || null,
  };
}

export function indexBy<T extends Record<string, string>>(
  rows: T[],
  key: keyof T
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const k = row[key]?.trim();
    if (k) map.set(k, row);
  }
  return map;
}

export function groupBy<T extends Record<string, string>>(
  rows: T[],
  key: keyof T
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = row[key]?.trim();
    if (!k) continue;
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}
