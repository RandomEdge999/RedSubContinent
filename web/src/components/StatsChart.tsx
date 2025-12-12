"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface StatsChartDatum {
    label: string;
    value: number;
}

interface StatsChartProps {
    data: StatsChartDatum[];
    height?: number;
}

/**
 * Minimal reusable bar chart for small stats panels.
 * Keeps the DOM light so it works both in the app and under Jest mocks.
 */
export default function StatsChart({ data, height = 220 }: StatsChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 12, right: 12, bottom: 30, left: 40 };
        const width = svgRef.current.clientWidth || 600;
        const innerWidth = Math.max(width - margin.left - margin.right, 0);
        const innerHeight = Math.max(height - margin.top - margin.bottom, 0);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        if (!data || data.length === 0) return;

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.label))
            .range([0, innerWidth])
            .padding(0.15);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.value) ?? 0])
            .nice()
            .range([innerHeight, 0]);

        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", (d) => (x(d.label) ?? 0))
            .attr("width", typeof x.bandwidth === "function" ? x.bandwidth() : 0)
            .attr("y", (d) => y(d.value))
            .attr("height", (d) => innerHeight - y(d.value))
            .attr("fill", "#8b0000")
            .attr("rx", 2);

        const hasAxes = typeof (d3 as any).axisBottom === "function" && typeof (d3 as any).axisLeft === "function";
        if (hasAxes) {
            g.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call((d3 as any).axisBottom(x).tickSizeOuter(0))
                .attr("class", "text-[10px] text-white/40");

            g.append("g")
                .call((d3 as any).axisLeft(y).ticks(4).tickSizeOuter(0))
                .attr("class", "text-[10px] text-white/40");
        }
    }, [data, height]);

    return <svg ref={svgRef} width="100%" height={height} className="overflow-visible" />;
}
