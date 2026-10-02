/** Fisher–Yates shuffle (mutates copy). */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickRandom<T>(items: T[], count: number, seed?: number): T[] {
  if (items.length <= count) return shuffle(items);
  if (seed != null) {
    let s = seed;
    const scored = items.map((item, i) => {
      s = (s * 1103515245 + 12345 + i) & 0x7fffffff;
      return { item, k: s };
    });
    scored.sort((a, b) => a.k - b.k);
    return scored.slice(0, count).map((x) => x.item);
  }
  return shuffle(items).slice(0, count);
}
