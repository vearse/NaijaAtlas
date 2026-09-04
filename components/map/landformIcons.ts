import type { Map } from "maplibre-gl";

const SIZE = 48;

function drawPeak(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.95, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.95, cy + r * 0.85);
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

function iconImage(kind: "peak" | "inselberg"): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2 + 2;
  const r = 15;

  if (kind === "peak") {
    drawPeak(ctx, cx, cy, r);
    ctx.fillStyle = "#44403c";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.55);
    ctx.lineTo(cx, cy + r * 0.35);
    ctx.strokeStyle = "#fafaf9";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    drawInselberg(ctx, cx, cy, r);
    ctx.fillStyle = "#78350f";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function landformIconId(kind: "peak" | "inselberg"): string {
  return `landform-icon-${kind}`;
}

export function registerLandformIcons(map: Map): void {
  for (const kind of ["peak", "inselberg"] as const) {
    const id = landformIconId(kind);
    if (map.hasImage(id)) continue;
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
}
