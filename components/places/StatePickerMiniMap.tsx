"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BASE_STYLE,
  GEO_SOURCES,
  createStateLayers,
  geoSourceUrl,
} from "@/components/map/mapLayers";
import { NIGERIA_BOUNDS } from "@/lib/map/constants";
import { getFeatureId } from "@/lib/map/constants";

type Props = {
  selectedStateId: string;
  slugByStateId: Record<string, string>;
  className?: string;
};

export default function StatePickerMiniMap({
  selectedStateId,
  slugByStateId,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const router = useRouter();

  const applySelected = useCallback(
    (map: maplibregl.Map, stateId: string) => {
      const source = GEO_SOURCES.adm1;
      for (const feature of map.querySourceFeatures(source) ?? []) {
        const id = getFeatureId(
          feature.properties as Record<string, unknown>
        );
        if (!id) continue;
        map.setFeatureState(
          { source, id },
          { selected: id === stateId, hover: false }
        );
      }
      map.setFeatureState(
        { source, id: stateId },
        { selected: true, hover: false }
      );
    },
    []
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      bounds: NIGERIA_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
      interactive: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    mapRef.current = map;
    let hoveredId: string | null = null;

    map.on("load", () => {
      map.addSource(GEO_SOURCES.adm1, geoSourceUrl("/geo/nigeria-adm1.geojson"));
      for (const layer of createStateLayers()) {
        map.addLayer(layer);
      }
      map.on("sourcedata", (e) => {
        if (e.sourceId === GEO_SOURCES.adm1 && e.isSourceLoaded) {
          applySelected(map, selectedStateId);
        }
      });
    });

    map.on("mousemove", "states-fill", (e) => {
      if (!e.features?.length) return;
      const id = getFeatureId(
        e.features[0].properties as Record<string, unknown>
      );
      if (!id || id === hoveredId) return;
      if (hoveredId) {
        map.setFeatureState(
          { source: GEO_SOURCES.adm1, id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = id;
      map.setFeatureState(
        { source: GEO_SOURCES.adm1, id },
        { hover: id !== selectedStateId }
      );
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "states-fill", () => {
      if (hoveredId) {
        map.setFeatureState(
          { source: GEO_SOURCES.adm1, id: hoveredId },
          { hover: false }
        );
        hoveredId = null;
      }
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "states-fill", (e) => {
      const id = e.features?.[0]
        ? getFeatureId(e.features[0].properties as Record<string, unknown>)
        : null;
      const slug = id ? slugByStateId[id] : null;
      if (slug) router.push(`/places/${slug}`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [applySelected, router, selectedStateId, slugByStateId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    applySelected(map, selectedStateId);
  }, [applySelected, selectedStateId]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-border-subtle shadow-md bg-slate-100 ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-text-secondary bg-surface-card/90 backdrop-blur rounded-lg py-1.5 border border-border-subtle">
        Click a state to switch profile
      </p>
    </div>
  );
}
