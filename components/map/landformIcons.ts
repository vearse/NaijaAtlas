import type { Map } from "maplibre-gl";
import type { LandformType } from "@/types/overlay";

const SIZE = 48;

/** Map catalog landformType → canvas icon id */
export const LANDFORM_ICON_BY_TYPE: Record<LandformType, string> = {
  savanna: "grass",
  basin: "sand",
  delta: "delta",
  forest: "forest",
  reserve: "reserve",
  hill: "hill",
  "mountain-range": "mountain",
  plateau: "plateau",
  escarpment: "escarpment",
  inselberg: "inselberg",
  peak: "peak",
};

type IconKind = (typeof LANDFORM_ICON_BY_TYPE)[keyof typeof LANDFORM_ICON_BY_TYPE];

function drawPeak(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.95, cy + r * 0.85);
  ctx.closePath();
}

function drawHills(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.05, cy + r * 0.75);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.1);
  ctx.lineTo(cx + r * 1.05, cy + r * 0.75);
  ctx.closePath();
}

function drawMountain(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.05, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.35, cy - r * 0.35);
  ctx.lineTo(cx, cy - r * 0.95);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.2);
  ctx.lineTo(cx + r * 1.05, cy + r * 0.8);
  ctx.closePath();
}

function drawPlateau(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy + r * 0.55);
  ctx.lineTo(cx - r * 0.55, cy - r * 0.65);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.65);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.55);
  ctx.closePath();
}

function drawInselberg(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.05);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.15);
  ctx.lineTo(cx + r * 0.75, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.75, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.55, cy + r * 0.15);
  ctx.closePath();
}

function drawEscarpment(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy - r * 0.55);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.95, cy + r * 0.85);
  ctx.closePath();
}

function drawGrass(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * r * 0.28;
    ctx.beginPath();
    ctx.moveTo(x, cy + r * 0.75);
    ctx.quadraticCurveTo(x - r * 0.12, cy - r * 0.05, x, cy - r * 0.85);
    ctx.quadraticCurveTo(x + r * 0.12, cy - r * 0.05, x, cy + r * 0.75);
  }
}

function drawSand(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy + r * 0.35);
  ctx.quadraticCurveTo(cx - r * 0.45, cy - r * 0.55, cx, cy - r * 0.25);
  ctx.quadraticCurveTo(cx + r * 0.55, cy + r * 0.15, cx + r * 0.95, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.95, cy + r * 0.85);
  ctx.closePath();
}

function drawDelta(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.15, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.85, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.85, cy + r * 0.85);
  ctx.closePath();
  for (let i = -1; i <= 1; i++) {
    ctx.moveTo(cx + i * r * 0.22, cy + r * 0.15);
    ctx.quadraticCurveTo(cx + i * r * 0.45, cy + r * 0.55, cx + i * r * 0.65, cy + r * 0.85);
  }
}

function drawForest(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.62, r * 0.38, 0, Math.PI * 2);
  ctx.moveTo(cx, cy + r * 0.22);
  ctx.lineTo(cx, cy - r * 0.82);
  for (const ox of [-0.42, 0, 0.42]) {
    ctx.moveTo(cx + r * ox, cy + r * 0.08);
    ctx.lineTo(cx + r * ox, cy - r * 0.62);
    ctx.lineTo(cx + r * (ox - 0.38), cy + r * 0.12);
    ctx.lineTo(cx + r * (ox + 0.38), cy + r * 0.12);
    ctx.closePath();
  }
}

function drawReserve(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy + r * 0.82);
  ctx.lineTo(cx - r * 0.08, cy - r * 0.72);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.82);
  ctx.closePath();
  ctx.moveTo(cx + r * 0.08, cy - r * 0.72);
  ctx.lineTo(cx + r * 0.62, cy + r * 0.82);
  ctx.lineTo(cx + r * 1.05, cy + r * 0.82);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.82);
  ctx.closePath();
  ctx.beginPath();
  ctx.rect(cx - r * 0.95, cy + r * 0.72, r * 1.9, r * 0.18);
}

const DRAW: Record<IconKind, (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void> = {
  peak: drawPeak,
  hill: drawHills,
  mountain: drawMountain,
  plateau: drawPlateau,
  inselberg: drawInselberg,
  escarpment: drawEscarpment,
  grass: drawGrass,
  sand: drawSand,
  delta: drawDelta,
  forest: drawForest,
  reserve: drawReserve,
};

const FILL: Record<IconKind, string> = {
  peak: "#44403c",
  hill: "#b45309",
  mountain: "#57534e",
  plateau: "#a16207",
  inselberg: "#78350f",
  escarpment: "#92400e",
  grass: "#65a30d",
  sand: "#ca8a04",
  delta: "#0891b2",
  forest: "#15803d",
  reserve: "#166534",
};

function iconImage(kind: IconKind): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2 + 2;
  const r = 13;

  ctx.beginPath();
  ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = FILL[kind];
  ctx.lineWidth = 3;
  ctx.stroke();

  DRAW[kind](ctx, cx, cy, r);
  ctx.fillStyle = FILL[kind];
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function landformIconId(kind: IconKind): string {
  return `landform-icon-${kind}`;
}

const ICON_KINDS = [...new Set(Object.values(LANDFORM_ICON_BY_TYPE))] as IconKind[];

export function registerLandformIcon(map: Map, kind: IconKind): void {
  const id = landformIconId(kind);
  if (map.hasImage(id)) return;
  const image = iconImage(kind);
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

export function registerLandformIcons(map: Map): void {
  for (const kind of ICON_KINDS) {
    registerLandformIcon(map, kind);
  }
}

export function landformKindFromImageId(imageId: string): IconKind | null {
  if (!imageId.startsWith("landform-icon-")) return null;
  const kind = imageId.slice("landform-icon-".length) as IconKind;
  return ICON_KINDS.includes(kind) ? kind : null;
}
