import type { Map } from "maplibre-gl";

export const WATERWAY_MILITARY_CATEGORIES = [
  "army-division",
  "navy-base",
  "airforce-hq",
  "airforce-base",
] as const;
export type WaterwayMilitaryCategory = (typeof WATERWAY_MILITARY_CATEGORIES)[number];

const SIZE = 48;
type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

function drawArmy(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.72, cy + r * 0.55);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.72, cy + r * 0.55);
  ctx.lineTo(cx - r * 0.85, cy - r * 0.35);
  ctx.closePath();
}

function drawShip(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy + r * 0.15);
  ctx.lineTo(cx - r * 0.55, cy + r * 0.72);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.72);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.15);
  ctx.closePath();
  ctx.rect(cx - r * 0.22, cy - r * 0.55, r * 0.44, r * 0.7);
  ctx.moveTo(cx, cy - r * 0.55);
  ctx.lineTo(cx, cy - r * 0.95);
}

function drawRoundel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.moveTo(cx - r * 0.95, cy);
  ctx.lineTo(cx + r * 0.95, cy);
  ctx.moveTo(cx - r * 0.92, cy - r * 0.18);
  ctx.lineTo(cx + r * 0.92, cy - r * 0.18);
  ctx.moveTo(cx - r * 0.92, cy + r * 0.18);
  ctx.lineTo(cx + r * 0.92, cy + r * 0.18);
}

function drawDelta(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy + r * 0.1);
  ctx.lineTo(cx, cy - r * 0.95);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.1);
  ctx.lineTo(cx + r * 0.45, cy + r * 0.1);
  ctx.lineTo(cx + r * 0.3, cy + r * 0.75);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.75);
  ctx.lineTo(cx - r * 0.45, cy + r * 0.1);
  ctx.closePath();
}

const DRAW: Record<WaterwayMilitaryCategory, DrawFn> = {
  "army-division": drawArmy,
  "navy-base": drawShip,
  "airforce-hq": drawRoundel,
  "airforce-base": drawDelta,
};

const FILL: Record<WaterwayMilitaryCategory, string> = {
  "army-division": "#3f6212",
  "navy-base": "#0f172a",
  "airforce-hq": "#0369a1",
  "airforce-base": "#1e40af",
};

function iconImage(category: WaterwayMilitaryCategory): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 16;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  DRAW[category](ctx, cx, cy, r);
  ctx.fillStyle = FILL[category];
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  if (category === "army-division") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.28);
    ctx.lineTo(cx + r * 0.22, cy + r * 0.08);
    ctx.lineTo(cx + r * 0.08, cy + r * 0.08);
    ctx.lineTo(cx + r * 0.28, cy + r * 0.42);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.42);
    ctx.lineTo(cx - r * 0.08, cy + r * 0.08);
    ctx.lineTo(cx - r * 0.22, cy + r * 0.08);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  if (category === "airforce-hq") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();
  }

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function waterwayIconId(category: string): string {
  return `waterway-icon-${category}`;
}

export function registerWaterwayIcons(map: Map): void {
  for (const category of WATERWAY_MILITARY_CATEGORIES) {
    const id = waterwayIconId(category);
    if (map.hasImage(id)) continue;
    const image = iconImage(category);
    map.addImage(
      id,
      {
        width: SIZE,
        height: SIZE,
        data: new Uint8Array(image.data),
      },
      { pixelRatio: 2 }
    );
  }
}
