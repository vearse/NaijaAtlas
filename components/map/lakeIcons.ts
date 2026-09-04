import type { Map } from "maplibre-gl";
import {
  POWER_PLANT_CATEGORIES,
  type PowerPlantCategory,
} from "@/types/overlay";

const SIZE = 48;

function drawBolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const s = scale;
  ctx.beginPath();
  ctx.moveTo(cx + 2 * s, cy - 14 * s);
  ctx.lineTo(cx - 6 * s, cy + 2 * s);
  ctx.lineTo(cx - 1 * s, cy + 2 * s);
  ctx.lineTo(cx - 4 * s, cy + 14 * s);
  ctx.lineTo(cx + 8 * s, cy - 2 * s);
  ctx.lineTo(cx + 2 * s, cy - 2 * s);
  ctx.closePath();
}

function iconImage(category: PowerPlantCategory): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = category === "major-hydro" ? 17 : 15;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = category === "major-hydro" ? "#ca8a04" : "#475569";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  drawBolt(ctx, cx, cy - 1, category === "major-hydro" ? 0.95 : 0.82);
  ctx.fill();

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function powerPlantIconId(category: string): string {
  return `power-icon-${category}`;
}

export function registerLakeIcons(map: Map): void {
  for (const category of POWER_PLANT_CATEGORIES) {
    const id = powerPlantIconId(category);
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
