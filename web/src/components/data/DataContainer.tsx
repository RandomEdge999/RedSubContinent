"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { getConflicts, getStatsSummary, getTimeline } from "@/lib/api";
import { formatNumber, formatDateRange, getConflictTypeLabel, getConflictTypeColor } from "@/lib/utils";
import type { ConflictType } from "@/types";

type TabType = "table" | "statistics" | "methodology";

export function DataContainer() {
    const [activeTab, setActiveTab] = useState<TabType>("table");
    const [page, setPage] = useState(1);

    const { data: conflictsData, isLoading } = useQuery({
        queryKey: ["conflicts", page],
        queryFn: () => getConflicts({}, page, 25),
    });

    const { data: stats } = useQuery({
        queryKey: ["stats-summary"],
        queryFn: getStatsSummary,
    });

    const { data: timeline } = useQuery({
        queryKey: ["timeline-decade"],
        queryFn: () => getTimeline(1900, 2024, "decade"),
    });

    // Calculate chart data
    const typeChartData = useMemo(() => {
        if (!stats?.by_type) return [];
        const entries = Object.entries(stats.by_type);
        const total = entries.reduce((sum, [, count]) => sum + (count as number), 0);
        return entries
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 8)
            .map(([type, count]) => ({
                type,
                count: count as number,
                percentage: Math.round(((count as number) / total) * 100),
                color: getConflictTypeColor(type as ConflictType),
            }));
    }, [stats]);

    const maxTimelineCount = useMemo(() => {
        if (!timeline) return 1;
        return Math.max(...timeline.map((t) => t.count), 1);
    }, [timeline]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] pt-16">
            {/* Header */}
            <header className="border-b border-white/5 py-12">
                <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">Database</p>
                    <h1 className="text-4xl md:text-5xl font-extralight mb-4">The Complete Record</h1>
                    <p className="text-lg text-white/40 max-w-2xl">
                        {stats?.total_conflicts || 0} documented events spanning {stats?.earliest_year || 1000} to {stats?.latest_year || 2024}
                    </p>
                </div>
            </header>

            {/* Stats row */}
            {stats && (
                <div className="border-b border-white/5 py-8">
                    <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl font-extralight text-white"
                                >
                                    {stats.total_conflicts}
                                </motion.p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Total Events</p>
                            </div>
                            <div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl font-extralight text-[#8b0000]"
                                >
                                    {formatNumber(stats.total_casualties_best || 0)}
                                </motion.p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Documented Casualties</p>
                            </div>
                            <div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-4xl font-extralight text-white"
                                >
                                    {Object.keys(stats.by_type || {}).length}
                                </motion.p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Event Types</p>
                            </div>
                            <div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl font-extralight text-white"
                                >
                                    {Object.keys(stats.by_century || {}).length}
                                </motion.p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">Centuries</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-white/5">
                <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                    <div className="flex gap-0">
                        {(["table", "statistics", "methodology"] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-5 text-sm font-medium transition-all relative ${activeTab === tab
                                    ? "text-white bg-white/[0.02]"
                                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.01]"
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b0000]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 lg:px-12 max-w-7xl py-12">
                <AnimatePresence mode="wait">
                    {activeTab === "table" && (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Table */}
                            <div className="border border-white/10 rounded overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/40 font-medium">Event</th>
                                            <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/40 font-medium">Date</th>
                                            <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/40 font-medium">Type</th>
                                            <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/40 font-medium">Region</th>
                                            <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/40 font-medium">Casualties</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            [...Array(10)].map((_, i) => (
                                                <tr key={i} className="border-t border-white/5">
                                                    <td className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse w-48" /></td>
                                                    <td className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse w-24" /></td>
                                                    <td className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse w-20" /></td>
                                                    <td className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse w-32" /></td>
                                                    <td className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse w-16 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            conflictsData?.items.map((conflict) => (
                                                <tr key={conflict.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm text-white/90 font-medium line-clamp-1">{conflict.title}</p>
                                                    </td>
                                                    <td className="p-4 text-sm text-white/50">
                                                        {formatDateRange(conflict.start_date, conflict.end_date)}
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-white/5"
                                                        >
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: getConflictTypeColor(conflict.conflict_type as ConflictType) }}
                                                            />
                                                            {getConflictTypeLabel(conflict.conflict_type as ConflictType)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-white/50 max-w-[200px] truncate">
                                                        {conflict.primary_region || "Unknown"}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {conflict.casualties_best ? (
                                                            <span className="text-sm text-[#8b0000] font-medium">
                                                                {formatNumber(conflict.casualties_best)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-white/20">Unknown</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {conflictsData && (
                                <div className="flex items-center justify-between mt-6">
                                    <p className="text-sm text-white/40">
                                        Page {conflictsData.page} of {conflictsData.total_pages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/5 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(conflictsData.total_pages, p + 1))}
                                            disabled={page === conflictsData.total_pages}
                                            className="px-4 py-2 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/5 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "statistics" && (
                        <motion.div
                            key="statistics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-16"
                        >
                            {/* By Type - Horizontal Bar Chart */}
                            <section>
                                <h3 className="text-xl font-light mb-8">Events by Type</h3>
                                <div className="space-y-4">
                                    {typeChartData.map((item, index) => (
                                        <motion.div
                                            key={item.type}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-4"
                                        >
                                            <div className="w-32 text-sm text-white/60">{getConflictTypeLabel(item.type as ConflictType)}</div>
                                            <div className="flex-1 h-8 bg-white/5 rounded overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.percentage}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                    className="h-full rounded flex items-center justify-end pr-3"
                                                    style={{ backgroundColor: item.color }}
                                                >
                                                    <span className="text-xs font-medium text-white">{item.count}</span>
                                                </motion.div>
                                            </div>
                                            <div className="w-12 text-right text-sm text-white/40">{item.percentage}%</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>

                            {/* 20th Century Timeline */}
                            {timeline && timeline.length > 0 && (
                                <section>
                                    <h3 className="text-xl font-light mb-2">20th-21st Century Timeline</h3>
                                    <p className="text-sm text-white/40 mb-8">Events per decade since 1900</p>
                                    <div className="flex items-end justify-between gap-2 h-64">
                                        {timeline.map((point, index) => (
                                            <motion.div
                                                key={point.year}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(point.count / maxTimelineCount) * 100}%` }}
                                                transition={{ duration: 0.8, delay: index * 0.05 }}
                                                className="flex-1 flex flex-col items-center group cursor-pointer"
                                            >
                                                <div
                                                    className="w-full bg-gradient-to-t from-[#8b0000] to-[#a00000] rounded-t hover:from-[#a00000] hover:to-[#c00000] transition-colors relative min-h-[4px]"
                                                    style={{ height: "100%" }}
                                                >
                                                    {/* Hover tooltip */}
                                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1a1a1c] border border-white/10 rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                        <p className="text-lg font-light">{point.count}</p>
                                                        <p className="text-[10px] text-white/50">events</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-white/30 mt-3 -rotate-45 origin-top-left whitespace-nowrap">
                                                    {point.year}s
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* By Century */}
                            {stats?.by_century && (
                                <section>
                                    <h3 className="text-xl font-light mb-2">Events by Century</h3>
                                    <p className="text-sm text-white/40 mb-8">All documented events across 1000 years</p>
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
                                        {Object.entries(stats.by_century).map(([century, count], index) => (
                                            <motion.div
                                                key={century}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="text-center p-4 border border-white/10 rounded hover:border-[#8b0000]/50 transition-colors group"
                                            >
                                                <p className="text-2xl font-light text-white group-hover:text-[#8b0000] transition-colors">
                                                    {count as number}
                                                </p>
                                                <p className="text-[10px] text-white/40 mt-1">{century}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "methodology" && (
                        <motion.div
                            key="methodology"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl"
                        >
                            <div className="prose prose-invert prose-sm">
                                <h2 className="text-2xl font-light text-white mb-6">Data Collection Methodology</h2>

                                <h3 className="text-lg font-light text-white/80 mt-8 mb-4">Sources</h3>
                                <p className="text-white/50 leading-relaxed mb-4">
                                    Data is collected from multiple sources including Wikipedia conflict lists,
                                    academic databases, and historical records. Each event is linked to its source
                                    for verification.
                                </p>

                                <h3 className="text-lg font-light text-white/80 mt-8 mb-4">Casualty Estimates</h3>
                                <p className="text-white/50 leading-relaxed mb-4">
                                    Historical casualty figures are inherently uncertain. Where possible, we provide
                                    ranges (low, high, best estimate). The &quot;best estimate&quot; is typically the median
                                    of credible sources or the most commonly cited figure.
                                </p>

                                <h3 className="text-lg font-light text-white/80 mt-8 mb-4">Geographic Coverage</h3>
                                <p className="text-white/50 leading-relaxed mb-4">
                                    This database covers conflicts in present-day India, Pakistan, Bangladesh,
                                    Afghanistan, Nepal, Bhutan, Sri Lanka, and Myanmar. Historical boundaries
                                    are mapped to modern geography where possible.
                                </p>

                                <h3 className="text-lg font-light text-white/80 mt-8 mb-4">Limitations</h3>
                                <ul className="text-white/50 space-y-2 list-disc pl-4">
                                    <li>Earlier centuries have fewer documented events due to historiographical gaps</li>
                                    <li>Casualty figures for pre-modern conflicts are estimates with high uncertainty</li>
                                    <li>Some events may have multiple interpretations across different sources</li>
                                    <li>Ongoing conflicts may be missing recent data</li>
                                </ul>

                                <h3 className="text-lg font-light text-white/80 mt-8 mb-4">Contributing</h3>
                                <p className="text-white/50 leading-relaxed">
                                    This is an open educational project. If you notice errors or have additional
                                    sources, please submit corrections through our GitHub repository.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
