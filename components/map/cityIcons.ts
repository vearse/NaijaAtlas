import type { Map } from "maplibre-gl";
import { CITY_CATEGORIES, type CityCategory } from "@/types/overlay";

const SIZE = 48;

type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5;
  const outer = r;
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (Math.PI / spikes) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(rad) * rr;
    const y = cy + Math.sin(rad) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.78, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.78, cy);
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.92, cy + r * 0.78);
  ctx.lineTo(cx - r * 0.92, cy + r * 0.78);
  ctx.closePath();
}

function drawSquare(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 1.45;
  ctx.beginPath();
  ctx.rect(cx - s / 2, cy - s / 2, s, s);
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawChevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.85, cy - r * 0.55);
  ctx.lineTo(cx, cy + r * 0.9);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.55);
  ctx.lineTo(cx, cy + r * 0.15);
  ctx.closePath();
}

function drawPlus(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const t = r * 0.38;
  const e = r * 0.95;
  ctx.beginPath();
  ctx.moveTo(cx - t, cy - e);
  ctx.lineTo(cx + t, cy - e);
  ctx.lineTo(cx + t, cy - t);
  ctx.lineTo(cx + e, cy - t);
  ctx.lineTo(cx + e, cy + t);
  ctx.lineTo(cx + t, cy + t);
  ctx.lineTo(cx + t, cy + e);
  ctx.lineTo(cx - t, cy + e);
  ctx.lineTo(cx - t, cy + t);
  ctx.lineTo(cx - e, cy + t);
  ctx.lineTo(cx - e, cy - t);
  ctx.lineTo(cx - t, cy - t);
  ctx.closePath();
}

function drawRounded(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 1.4;
  const rad = r * 0.35;
  const x = cx - s / 2;
  const y = cy - s / 2;
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + s, y, x + s, y + s, rad);
  ctx.arcTo(x + s, y + s, x, y + s, rad);
  ctx.arcTo(x, y + s, x, y, rad);
  ctx.arcTo(x, y, x + s, y, rad);
  ctx.closePath();
}

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

function drawMega(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

const DRAW: Record<CityCategory, DrawFn> = {
  "federal-capital": drawStar,
  "mega-city": drawMega,
  "state-capital": drawDiamond,
  commercial: drawHexagon,
  historic: drawTriangle,
  "port-city": drawChevron,
  industrial: drawSquare,
  university: drawPlus,
  regional: drawRounded,
};

const FILL: Record<CityCategory, string> = {
  "federal-capital": "#7c3aed",
  "mega-city": "#dc2626",
  "state-capital": "#008751",
  commercial: "#ea580c",
  historic: "#92400e",
  "port-city": "#1d4ed8",
  industrial: "#475569",
  university: "#0f766e",
  regional: "#64748b",
};

function iconImage(category: CityCategory): ImageData {
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

  if (category === "mega-city") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function cityIconId(category: string): string {
  return `city-icon-${category}`;
}

export function registerCityIcons(map: Map): void {
  for (const category of CITY_CATEGORIES) {
    const id = cityIconId(category);
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
