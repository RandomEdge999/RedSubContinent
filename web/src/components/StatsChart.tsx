"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataItem {
    label: string;
    value: number;
}

export default function StatsChart({ data }: { data: DataItem[] }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select(ref.current);
        const width = 300;
        const height = 200;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Clear previous drawing
        svg.selectAll("*").remove();

        const x = d3
            .scaleBand<string>()
            .domain(data.map(d => d.label))
            .range([0, innerWidth])
            .padding(0.2);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.value) ?? 0])
            .nice()
            .range([innerHeight, 0]);

        const chart = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Bars
        chart
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.label) ?? 0)
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.value))
            .attr("fill", "#8b0000");
    }, [data]);

    return <svg ref={ref} width={300} height={200} className="overflow-visible" />;
}
