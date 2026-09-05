import type { Map } from "maplibre-gl";
import { COAST_CATEGORIES, type CoastCategory } from "@/types/overlay";

const SIZE = 48;

type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

function drawAnchor(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.35, r * 0.38, 0, Math.PI * 2);
  ctx.moveTo(cx, cy - r * 0.05);
  ctx.lineTo(cx, cy + r * 0.85);
  ctx.moveTo(cx - r * 0.55, cy + r * 0.35);
  ctx.quadraticCurveTo(cx, cy + r * 0.15, cx + r * 0.55, cy + r * 0.35);
}

function drawDroplet(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.95, cy - r * 0.15, cx + r * 0.65, cy + r * 0.85, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.65, cy + r * 0.85, cx - r * 0.95, cy - r * 0.15, cx, cy - r);
  ctx.closePath();
}

function drawWaves(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let i = -1; i <= 1; i++) {
    const y = cy + i * r * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.9, y);
    ctx.quadraticCurveTo(cx - r * 0.45, y - r * 0.28, cx, y);
    ctx.quadraticCurveTo(cx + r * 0.45, y + r * 0.28, cx + r * 0.9, y);
  }
}

function drawLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.85);
  ctx.quadraticCurveTo(cx - r * 0.95, cy - r * 0.15, cx, cy - r * 0.85);
  ctx.quadraticCurveTo(cx + r * 0.95, cy - r * 0.15, cx, cy + r * 0.85);
  ctx.closePath();
  ctx.moveTo(cx, cy + r * 0.75);
  ctx.lineTo(cx, cy - r * 0.65);
}

function drawColumn(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const w = r * 0.42;
  ctx.beginPath();
  ctx.rect(cx - w, cy - r * 0.75, w * 2, r * 1.45);
  ctx.moveTo(cx - r * 0.72, cy + r * 0.72);
  ctx.lineTo(cx + r * 0.72, cy + r * 0.72);
  ctx.lineTo(cx + r * 0.58, cy + r * 0.88);
  ctx.lineTo(cx - r * 0.58, cy + r * 0.88);
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

const DRAW: Record<CoastCategory, DrawFn> = {
  seaport: drawAnchor,
  "oil-terminal": drawDroplet,
  estuary: drawWaves,
  environment: drawLeaf,
  historic: drawColumn,
};

const FILL: Record<CoastCategory, string> = {
  seaport: "#1e3a8a",
  "oil-terminal": "#d97706",
  estuary: "#0891b2",
  environment: "#059669",
  historic: "#92400e",
};

function iconImage(category: CoastCategory): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 14;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(cx, cy, 17, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = FILL[category];
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.strokeStyle = FILL[category];
  ctx.fillStyle = FILL[category];
  ctx.lineWidth = 2.8;
  DRAW[category](ctx, cx, cy, r);
  if (category === "estuary") ctx.stroke();
  else ctx.fill();

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function coastIconId(category: string): string {
  return `coast-icon-${category}`;
}

export function registerCoastIcons(map: Map): void {
  for (const category of COAST_CATEGORIES) {
    const id = coastIconId(category);
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
