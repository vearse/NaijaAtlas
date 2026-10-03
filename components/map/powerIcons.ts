import type { Map } from "maplibre-gl";
import {
  GRID_VOLTAGE_CLASSES,
  POWER_PLANT_CATEGORIES,
  isHydroCategory,
  type PowerPlantCategory,
} from "@/types/overlay";

const SIZE = 48;

/** Icon palette, keyed to POWER_PLANT_CATEGORY_LABELS in types/overlay.ts. */
const PLANT_COLORS: Record<PowerPlantCategory, string> = {
  "major-hydro": "#ca8a04",
  "regional-hydro": "#64748b",
  "gas-ccgt": "#b45309",
  "gas-ocgt": "#d97706",
  steam: "#7c2d12",
};

function drawBolt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number
) {
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

function plantIconImage(category: PowerPlantCategory): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  // The four NEPA majors carry the grid, so they get the largest disc and a
  // heavier ring; regional schemes and the gas fleet read smaller.
  const r = category === "major-hydro" ? 18 : isHydroCategory(category) ? 15 : 15;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = PLANT_COLORS[category];
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = category === "major-hydro" ? 4 : 3.5;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  drawBolt(ctx, cx, cy - 1, category === "major-hydro" ? 1 : 0.82);
  ctx.fill();

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

/**
 * Distribution companies get a hexagonal badge rather than the round generation
 * disc, so a DisCo can never be mistaken for a power station at a glance.
 */
function distributorIconImage(): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  // A regular hexagon of circumradius r covers far less area than a circle of
  // the same r, so it is drawn larger to read at the same weight as a station.
  const r = 20;

  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#1d4ed8";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Three stepped pylon bars: distribution, not generation.
  ctx.fillStyle = "#ffffff";
  const bar = (offset: number, height: number) =>
    ctx.fillRect(cx - 9 + offset, cy + 9 - height, 4.6, height);
  bar(0, 10);
  bar(6.2, 14);
  bar(12.4, 18);

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

/** Transmission substations: a square, so they never read as a bolt or disc. */
function substationIconImage(voltage: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const isBackbone = voltage === 330;
  const r = isBackbone ? 15 : 12;

  ctx.fillStyle = isBackbone ? "#0f766e" : "#5eead4";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.rect(cx - r, cy - r, r * 2, r * 2);
  ctx.fill();
  ctx.stroke();

  // A single vertical bar inside: busbar / transformer leg.
  ctx.fillStyle = isBackbone ? "#ffffff" : "#0f766e";
  ctx.fillRect(cx - 2.2, cy - r * 0.55, 4.4, r * 1.1);

  return ctx.getImageData(0, 0, SIZE, SIZE);
}

export function powerPlantIconId(category: string): string {
  return `power-icon-${category}`;
}

export function distributorIconId(): string {
  return "power-icon-distributor";
}

export function substationIconId(voltage: number): string {
  return `power-icon-substation-${voltage}`;
}

function addIcon(map: Map, id: string, image: ImageData): void {
  if (map.hasImage(id)) return;
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

export function registerPowerIcons(map: Map): void {
  for (const category of POWER_PLANT_CATEGORIES) {
    addIcon(map, powerPlantIconId(category), plantIconImage(category));
  }
  addIcon(map, distributorIconId(), distributorIconImage());
  for (const voltage of GRID_VOLTAGE_CLASSES) {
    addIcon(map, substationIconId(voltage), substationIconImage(voltage));
  }
}