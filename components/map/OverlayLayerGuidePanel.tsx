"use client";

import { useMapStore } from "@/lib/store/mapStore";
import {
  OVERLAY_LAYER_GUIDES,
  OVERLAY_LAYER_LABELS,
  type OverlayLayerId,
} from "@/types/overlay";

export default function OverlayLayerGuidePanel({
  layerId,
}: {
  layerId: OverlayLayerId;
}) {
  const clearOverlayGuide = useMapStore((s) => s.clearOverlayGuide);
  const guide = OVERLAY_LAYER_GUIDES[layerId];
  const meta = OVERLAY_LAYER_LABELS[layerId];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {meta.label} layer · guide
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{guide.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => clearOverlayGuide()}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Close layer guide"
        >
          Close
        </button>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{guide.summary}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{guide.description}</p>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What&apos;s on this layer
          </p>
          <ul className="space-y-1.5">
            {guide.includes.map((item) => (
              <li
                key={item}
                className="text-sm text-slate-700 pl-3 relative leading-relaxed"
              >
                <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-ng-green" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Map legend
          </p>
          <ul className="space-y-1">
            {guide.legend.map((item) => (
              <li key={item} className="text-xs text-slate-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-500 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 leading-relaxed">
        <span className="font-semibold text-emerald-800">Tip · </span>
        {guide.tip}
      </p>
    </div>
  );
}
