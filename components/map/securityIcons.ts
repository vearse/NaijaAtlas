import type { Map } from "maplibre-gl";
import {
  SECURITY_FORMATION_CATEGORIES,
  type SecurityFormationCategory,
} from "@/types/overlay";

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

/** Approved but not yet established: the army shield drawn as an outline. */
function drawArmyProposed(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  drawArmy(ctx, cx, cy, r);
}

const DRAW: Record<SecurityFormationCategory, DrawFn> = {
  "army-division": drawArmy,
  "proposed-army-division": drawArmyProposed,
  "navy-base": drawShip,
  "airforce-hq": drawRoundel,
  "airforce-base": drawDelta,
};

const FILL: Record<SecurityFormationCategory, string> = {
  "army-division": "#3f6212",
  "proposed-army-division": "#7c3aed",
  "navy-base": "#1e3a8a",
  "airforce-hq": "#0369a1",
  "airforce-base": "#0284c7",
};

function iconImage(category: SecurityFormationCategory): ImageData {
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

  const isProposed = category === "proposed-army-division";

  DRAW[category](ctx, cx, cy, r);
  // Proposed formations are outlined, not filled, to read as "forming".
  if (isProposed) {
    ctx.strokeStyle = FILL[category];
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Dashed outer ring, as with the proposed-port glyph.
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.strokeStyle = FILL[category];
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3.5, 3.5]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = FILL[category];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  if (category === "army-division" || isProposed) {
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

export function securityIconId(category: string): string {
  return `security-icon-${category}`;
}

export function registerSecurityIcons(map: Map): void {
  for (const category of SECURITY_FORMATION_CATEGORIES) {
    const id = securityIconId(category);
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
