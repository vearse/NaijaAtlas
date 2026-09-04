import type { Map } from "maplibre-gl";

export const RESOURCE_TYPES = [
  "crude-oil",
  "natural-gas",
  "coal",
  "tin-columbite",
  "iron-ore",
  "gold",
  "limestone",
  "bitumen",
  "lead-zinc",
  "lithium-rare",
  "marble",
  "salt-potash",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

const SIZE = 48;
type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void;

function drawDrop(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.95, cy - r * 0.15, cx + r * 0.7, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.7, cy + r, cx - r * 0.95, cy - r * 0.15, cx, cy - r);
  ctx.closePath();
}

function drawFlame(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 0.7, cy - r * 0.4, cx + r * 0.65, cy + r * 0.25, cx + r * 0.18, cy + r * 0.6);
  ctx.bezierCurveTo(cx + r * 0.5, cy + r * 0.35, cx + r * 0.4, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.4, cy + r, cx - r * 0.5, cy + r * 0.35, cx - r * 0.18, cy + r * 0.6);
  ctx.bezierCurveTo(cx - r * 0.65, cy + r * 0.25, cx - r * 0.7, cy - r * 0.4, cx, cy - r);
  ctx.closePath();
}

function drawCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 0.78;
  const d = r * 0.4;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - d * 0.5);
  ctx.lineTo(cx, cy - s);
  ctx.lineTo(cx + s, cy - d * 0.5);
  ctx.lineTo(cx, cy + d);
  ctx.closePath();
  ctx.moveTo(cx - s, cy - d * 0.5);
  ctx.lineTo(cx - s, cy + s * 0.7);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx, cy + d);
  ctx.moveTo(cx + s, cy - d * 0.5);
  ctx.lineTo(cx + s, cy + s * 0.7);
  ctx.lineTo(cx, cy + s);
}

function drawSpark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 6;
  const outer = r;
  const inner = r * 0.38;
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

function drawPick(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.9, cy + r * 0.55);
  ctx.lineTo(cx - r * 0.55, cy + r * 0.85);
  ctx.lineTo(cx, cy + r * 0.3);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.85);
  ctx.lineTo(cx + r * 0.9, cy + r * 0.55);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.1);
  ctx.lineTo(cx + r * 0.65, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.25, cy - r * 0.55);
  ctx.lineTo(cx - r * 0.1, cy - r * 0.2);
  ctx.lineTo(cx - r * 0.5, cy + r * 0.1);
  ctx.closePath();
}

function drawTank(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.2, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
  ctx.rect(cx - r * 0.85, cy - r * 0.2, r * 1.7, r * 0.85);
  ctx.ellipse(cx, cy + r * 0.65, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
}

function drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.moveTo(cx - r * 0.5, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.5, cy - r * 0.1);
  ctx.moveTo(cx, cy - r * 0.6);
  ctx.lineTo(cx, cy + r * 0.55);
  ctx.moveTo(cx - r * 0.28, cy + r * 0.25);
  ctx.lineTo(cx + r * 0.28, cy + r * 0.25);
}

function drawMountain(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.05, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.35, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.1, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.05);
  ctx.lineTo(cx + r * 1.05, cy + r * 0.85);
  ctx.closePath();
  ctx.moveTo(cx - r * 0.22, cy - r * 0.02);
  ctx.lineTo(cx + r * 0.1, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.32, cy - r * 0.02);
  ctx.closePath();
}

function drawBarrel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.rect(cx - r * 0.68, cy - r * 0.85, r * 1.36, r * 1.7);
  ctx.moveTo(cx - r * 0.68, cy - r * 0.25);
  ctx.lineTo(cx + r * 0.68, cy - r * 0.25);
  ctx.moveTo(cx - r * 0.68, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.68, cy + r * 0.35);
  ctx.moveTo(cx - r * 0.68, cy - r * 0.85);
  ctx.ellipse(cx, cy - r * 0.85, r * 0.68, r * 0.25, 0, 0, Math.PI * 2);
  ctx.moveTo(cx - r * 0.68, cy + r * 0.85);
  ctx.ellipse(cx, cy + r * 0.85, r * 0.68, r * 0.25, 0, 0, Math.PI * 2);
}

function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const t = r * 0.32;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.moveTo(cx + (r * 0.9 - t), cy);
  ctx.arc(cx, cy, r * 0.9 - t, 0, Math.PI * 2, true);
}

function drawLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy + r * 0.9);
  ctx.quadraticCurveTo(cx - r, cy + r * 0.3, cx - r * 0.2, cy - r * 0.9);
  ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.2, cx + r * 0.7, cy - r * 0.1);
  ctx.quadraticCurveTo(cx + r * 0.15, cy + r * 0.25, cx - r * 0.2, cy + r * 0.9);
  ctx.moveTo(cx - r * 0.2, cy + r * 0.9);
  ctx.quadraticCurveTo(cx + r * 0.05, cy + r * 0.2, cx + r * 0.3, cy - r * 0.25);
}

function drawShaker(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.5, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.75, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.75, cy + r * 0.85);
  ctx.closePath();
  ctx.moveTo(cx - r * 0.75, cy + r * 0.15);
  ctx.lineTo(cx + r * 0.75, cy + r * 0.15);
}

const DRAW: Record<ResourceType, DrawFn> = {
  "crude-oil": drawDrop,
  "natural-gas": drawFlame,
  coal: drawCube,
  "tin-columbite": drawSpark,
  "iron-ore": drawPick,
  gold: drawCoin,
  limestone: drawMountain,
  bitumen: drawTank,
  "lead-zinc": drawCube,
  "lithium-rare": drawSpark,
  marble: drawMountain,
  "salt-potash": drawShaker,
};

const FILL: Record<ResourceType, string> = {
  "crude-oil": "#0f172a",
  "natural-gas": "#ea580c",
  coal: "#111827",
  "tin-columbite": "#64748b",
  "iron-ore": "#78350f",
  gold: "#ca8a04",
  limestone: "#a16207",
  bitumen: "#18181b",
  "lead-zinc": "#475569",
  "lithium-rare": "#0ea5e9",
  marble: "#a8a29e",
  "salt-potash": "#0891b2",
};

const STROKE: Record<ResourceType, string> = {
  "crude-oil": "#fbbf24",
  "natural-gas": "#fde047",
  coal: "#facc15",
  "tin-columbite": "#fef3c7",
  "iron-ore": "#fcd34d",
  gold: "#fef9c3",
  limestone: "#fef3c7",
  bitumen: "#fde68a",
  "lead-zinc": "#fde68a",
  "lithium-rare": "#bae6fd",
  marble: "#fafaf9",
  "salt-potash": "#cffafe",
};

function iconImage(type: ResourceType): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2 + 2;
  const r = 14;

  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = FILL[type];
  ctx.lineWidth = 3;
  ctx.stroke();

  DRAW[type](ctx, cx, cy, r);
  ctx.fillStyle = FILL[type];
  ctx.fill();
  ctx.strokeStyle = STROKE[type];
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (type === "gold") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.strokeStyle = "#fef9c3";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (type === "crude-oil") {
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function resourceIconId(type: ResourceType): string {
  return `resource-icon-${type}`;
}

export function registerResourceIcons(map: Map): void {
  for (const type of RESOURCE_TYPES) {
    const id = resourceIconId(type);
    if (map.hasImage(id)) continue;
    const image = iconImage(type);
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
