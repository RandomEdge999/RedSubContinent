"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import { getTimeline } from "@/lib/api";
import { motion } from "framer-motion";

export default function TimelineChart() {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const { data: timelineData } = useQuery({
        queryKey: ["timeline"],
        queryFn: () => getTimeline(1000, 2024, "decade"),
    });

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Draw Chart
    useEffect(() => {
        if (!timelineData || !svgRef.current || dimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleLinear()
            .domain(d3.extent(timelineData, d => d.year) as [number, number])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(timelineData, d => d.casualties) || 0])
            .range([innerHeight, 0]);

        // Gradient Definition
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "area-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#8b0000")
            .attr("stop-opacity", 0.6);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#8b0000")
            .attr("stop-opacity", 0);

        // Area Generator
        const area = d3.area<any>()
            .x(d => x(d.year))
            .y0(innerHeight)
            .y1(d => y(d.casualties))
            .curve(d3.curveMonotoneX);

        // Draw Area
        g.append("path")
            .datum(timelineData)
            .attr("fill", "url(#area-gradient)")
            .attr("d", area)
            .attr("class", "transition-all duration-1000");

        // Line Generator
        const line = d3.line<any>()
            .x(d => x(d.year))
            .y(d => y(d.casualties))
            .curve(d3.curveMonotoneX);

        // Draw Line
        g.append("path")
            .datum(timelineData)
            .attr("fill", "none")
            .attr("stroke", "#8b0000")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Axes
        const xAxis = d3.axisBottom(x).tickFormat(d => String(d));
        const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => d3.format("~s")(d));

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr("class", "text-white/30 text-xs")
            .select(".domain").remove();

        g.append("g")
            .call(yAxis)
            .attr("class", "text-white/30 text-xs")
            .select(".domain").remove();

        // Grid lines (horizontal)
        g.selectAll("line.grid-line")
            .data(y.ticks(5))
            .enter()
            .append("line")
            .attr("class", "grid-line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", d => y(d))
            .attr("y2", d => y(d))
            .attr("stroke", "rgba(255,255,255,0.05)")
            .attr("stroke-dasharray", "4 4");

    }, [timelineData, dimensions]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-white/80">Casualty Timeline</h3>
                <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#8b0000]/50" />
                    <span className="text-xs text-white/40">Deaths per Decade</span>
                </div>
            </div>

            <div ref={containerRef} className="w-full h-[300px]">
                <svg ref={svgRef} width="100%" height="100%" className="overflow-visible" />
            </div>
        </motion.div>
    );
}
