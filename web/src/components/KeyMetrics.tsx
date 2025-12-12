"use client";

import { motion } from "framer-motion";
import { StatsSummary } from "@/types";

interface KeyMetricsProps {
    stats: StatsSummary;
}

export default function KeyMetrics({ stats }: KeyMetricsProps) {
    const metrics = [
        {
            label: "Total Events",
            value: stats.total_conflicts.toLocaleString(),
            subtext: "Documented Conflicts",
            delay: 0,
        },
        {
            label: "Lives Lost",
            value: formatMillions(stats.total_casualties_best),
            subtext: "Estimated Casualties",
            delay: 0.1,
            highlight: true,
        },
        {
            label: "Timeline",
            value: `${stats.earliest_year || 1000} - ${stats.latest_year || 2024}`,
            subtext: "Years Covered",
            delay: 0.2,
        }
    ];

    return (
        <div className="grid md:grid-cols-3 gap-6 mb-12">
            {metrics.map((metric, idx) => (
                <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: metric.delay, duration: 0.5 }}
                    className={`
                        relative overflow-hidden rounded-2xl border p-8 backdrop-blur-md
                        ${metric.highlight
                            ? "border-[#8b0000]/50 bg-[#8b0000]/10"
                            : "border-white/10 bg-white/5"}
                    `}
                >
                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                            {metric.label}
                        </p>
                        <h3 className={`text-4xl lg:text-5xl font-light mb-2 ${metric.highlight ? "text-[#ff3333]" : "text-white"}`}>
                            {metric.value}
                        </h3>
                        <p className="text-sm text-white/30 font-light">
                            {metric.subtext}
                        </p>
                    </div>

                    {/* Glass sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                </motion.div>
            ))}
        </div>
    );
}

function formatMillions(num: number | null): string {
    if (!num) return "0";
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M+";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K+";
    }
    return num.toLocaleString();
}
