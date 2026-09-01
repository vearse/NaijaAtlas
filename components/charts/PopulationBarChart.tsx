"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { StateLocation } from "@/types/location";

interface PopulationBarChartProps {
  states: StateLocation[];
  highlightId?: string;
}

/** LGA count by state — proxy chart when census data unavailable */
export default function PopulationBarChart({
  states,
  highlightId,
}: PopulationBarChartProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const data = [...states]
      .sort((a, b) => b.lgaCount - a.lgaCount)
      .slice(0, 10);

    const width = 320;
    const height = 220;
    const margin = { top: 8, right: 36, bottom: 8, left: 90 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const maxCount = d3.max(data, (d) => d.lgaCount) ?? 1;
    const x = d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.15);

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", (d) => y(d.name)!)
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 3)
      .attr("fill", (d) =>
        d.id === highlightId ? "#008751" : "#94a3b8"
      )
      .transition()
      .duration(500)
      .attr("width", (d) => x(d.lgaCount) - margin.left);

    svg
      .append("g")
      .selectAll("text.label-name")
      .data(data)
      .join("text")
      .attr("class", "label-name")
      .attr("x", margin.left - 6)
      .attr("y", (d) => y(d.name)! + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("fill", "#475569")
      .text((d) => (d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name));

    svg
      .append("g")
      .selectAll("text.label-value")
      .data(data)
      .join("text")
      .attr("class", "label-value")
      .attr("x", (d) => x(d.lgaCount) + 4)
      .attr("y", (d) => y(d.name)! + y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("font-weight", 600)
      .attr("fill", (d) => (d.id === highlightId ? "#008751" : "#64748b"))
      .attr("opacity", 0)
      .text((d) => d.lgaCount)
      .transition()
      .delay(300)
      .duration(400)
      .attr("opacity", 1);
  }, [states, highlightId]);

  const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h4 className="text-xs font-semibold uppercase text-slate-400">
          LGA count — top states
        </h4>
        <p className="text-[10px] font-medium text-slate-500">
          Total{" "}
          <span className="text-ng-green font-bold">{totalLgas}</span> LGAs
        </p>
      </div>
      <svg ref={ref} className="w-full h-auto" aria-hidden />
    </div>
  );
}
