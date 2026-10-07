import fs from "fs";
import path from "path";

let cached: string | null = null;

/** Resolve repo root when `process.cwd()` is not the app directory (e.g. monorepo / Vercel). */
export function serverProjectRoot(): string {
  if (cached) return cached;

  const marker = path.join("data", "locations", "polling-unit-counts.json");
  const seeds = [
    process.cwd(),
    path.join(process.cwd(), "ExploreNigeria"),
    path.dirname(process.cwd()),
  ];

  for (const seed of seeds) {
    let dir = path.resolve(seed);
    for (let depth = 0; depth < 6; depth++) {
      if (fs.existsSync(path.join(dir, marker))) {
        cached = dir;
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  cached = process.cwd();
  return cached;
}
