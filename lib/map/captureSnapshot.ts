import type { Map as MaplibreMap } from "maplibre-gl";
import { toCanvas } from "html-to-image";
import { useMapStore } from "@/lib/store/mapStore";
import type { LgaLocation, RegionLocation, StateLocation } from "@/types/location";

const MAX_DIMENSION = 2400;
const LOGO_SRC = "/logo.jpeg";

export type CaptureScope = "map" | "panel" | "workspace";

let logoImage: HTMLImageElement | null = null;

function loadLogo(): Promise<HTMLImageElement> {
  if (logoImage?.complete) return Promise.resolve(logoImage);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImage = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Could not load watermark logo"));
    img.src = LOGO_SRC;
  });
}

function scaleForExport(width: number, height: number): number {
  const longest = Math.max(width, height);
  if (longest <= MAX_DIMENSION) return 1;
  return MAX_DIMENSION / longest;
}

async function applyWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Promise<void> {
  const logo = await loadLogo();
  const inset = Math.max(8, Math.round(width * 0.012));
  const logoSize = Math.max(24, Math.round(width * 0.028));
  const x = width - logoSize - inset;
  const y = height - logoSize - inset;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const pad = Math.round(logoSize * 0.12);
  const rx = x - pad;
  const ry = y - pad;
  const rw = logoSize + pad * 2;
  const rh = logoSize + pad * 2;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 6);
    ctx.fill();
  } else {
    ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.globalAlpha = 0.92;
  ctx.drawImage(logo, x, y, logoSize, logoSize);
  ctx.restore();
}

function isMapCanvas(node: Node): boolean {
  return (
    node instanceof HTMLCanvasElement &&
    node.classList.contains("maplibregl-canvas")
  );
}

function isCaptureExcluded(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  if (node.hasAttribute("data-capture-exclude")) return true;
  return Boolean(node.closest("[data-capture-exclude]"));
}

function captureFilter(node: Node): boolean {
  if (isCaptureExcluded(node)) return false;
  if (isMapCanvas(node)) return false;
  return true;
}

async function waitForMapPaint(map: MaplibreMap): Promise<void> {
  if (!map.isStyleLoaded()) {
    await new Promise<void>((resolve) => {
      map.once("idle", () => resolve());
    });
  }
  map.triggerRepaint();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function captureElementToPng(
  element: HTMLElement,
  options?: { skipMapComposite?: boolean }
): Promise<Blob> {
  const rect = element.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const layoutScale = scaleForExport(w, h);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelRatio = layoutScale * dpr;
  const outW = Math.round(w * pixelRatio);
  const outH = Math.round(h * pixelRatio);

  const map = useMapStore.getState().mapInstance;
  const mapCanvasView = useMapStore.getState().mapCanvasView;
  const useMapComposite =
    !options?.skipMapComposite &&
    map &&
    mapCanvasView === "map" &&
    element.querySelector(".maplibregl-canvas");

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create capture canvas");

  if (useMapComposite && map) {
    await waitForMapPaint(map);
    const mapCanvas = map.getCanvas();
    const mapContainer = map.getContainer();
    const frameRect = element.getBoundingClientRect();
    const mapRect = mapContainer.getBoundingClientRect();
    const offsetX = (mapRect.left - frameRect.left) * pixelRatio;
    const offsetY = (mapRect.top - frameRect.top) * pixelRatio;
    const mapW = mapRect.width * pixelRatio;
    const mapH = mapRect.height * pixelRatio;

    ctx.drawImage(mapCanvas, offsetX, offsetY, mapW, mapH);

    const overlayCanvas = await toCanvas(element, {
      pixelRatio,
      width: w,
      height: h,
      cacheBust: true,
      filter: captureFilter,
    });
    ctx.drawImage(overlayCanvas, 0, 0, outW, outH);
  } else {
    const fullCanvas = await toCanvas(element, {
      pixelRatio,
      width: w,
      height: h,
      cacheBust: true,
      filter: captureFilter,
    });
    ctx.drawImage(fullCanvas, 0, 0, outW, outH);
  }

  await applyWatermark(ctx, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode PNG"));
      },
      "image/png",
      1
    );
  });
}

export async function captureMapFrame(frameEl: HTMLElement): Promise<Blob> {
  return captureElementToPng(frameEl);
}

export async function captureWorkspaceFrame(
  workspaceEl: HTMLElement
): Promise<Blob> {
  return captureElementToPng(workspaceEl);
}

export function findPanelCaptureElement(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    '[data-capture-root="panel"]'
  );
  let best: HTMLElement | null = null;
  let bestArea = 0;
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    const area = r.width * r.height;
    if (area > bestArea && r.width >= 80 && r.height >= 80) {
      bestArea = area;
      best = el;
    }
  }
  return best;
}

export async function capturePanelFrame(): Promise<Blob> {
  const panel = findPanelCaptureElement();
  if (!panel) {
    throw new Error(
      "No panel visible to capture. Open the details panel on mobile, or use a wider screen."
    );
  }
  return captureElementToPng(panel, { skipMapComposite: true });
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildCaptureFilename(
  presetTitle: string,
  scope: CaptureScope
): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugifyTitle(presetTitle) || "map";
  const scopeLabel =
    scope === "map"
      ? "map"
      : scope === "panel"
        ? "panel"
        : "full-view";
  return `NaijaAtlas-${slug}-${scopeLabel}-${date}.png`;
}

export function buildShareText(
  presetLabel: string,
  states: StateLocation[],
  regions: RegionLocation[],
  lgas: LgaLocation[]
): string {
  const store = useMapStore.getState();
  const parts: string[] = [`NaijaAtlas — ${presetLabel}`];

  if (store.selectedLgaId) {
    const lga = lgas.find((l) => l.id === store.selectedLgaId);
    parts.push(
      lga ? `${lga.name}, ${lga.stateName}` : "Selected local government area"
    );
  } else if (store.selectedStateIds.size > 0) {
    const names = states
      .filter((s) => store.selectedStateIds.has(s.id))
      .map((s) => s.name);
    if (names.length === 1) parts.push(names[0]);
    else if (names.length <= 3) parts.push(names.join(", "));
    else parts.push(`${names.slice(0, 3).join(", ")} and ${names.length - 3} more`);
  } else if (store.activeRegionId) {
    const region = regions.find((r) => r.id === store.activeRegionId);
    parts.push(region ? region.name : "Selected region");
  }

  const url = new URL(window.location.href);
  url.search = "";
  parts.push(url.toString());
  return parts.join("\n");
}
