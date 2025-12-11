"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import MapExplorer from "@/components/MapExplorer";

import { getConflicts, getConflictsGeoJSON, getStatsSummary } from "@/lib/api";
import {
    formatNumber,
    formatDateRange,
    getConflictTypeLabel,
    getConflictTypeColor,
} from "@/lib/utils";
import type { ConflictType, ConflictFilters, ConflictListItem } from "@/types";

const CONFLICT_TYPES: ConflictType[] = [
    "war", "invasion", "massacre", "riot", "famine",
    "partition_event", "uprising", "imperial_campaign",
    "civil_conflict", "communal_violence", "other",
];

export function ExplorerContainer() {

    const [mapReady, setMapReady] = useState(false);

    const [yearStart, setYearStart] = useState(1000);
    const [yearEnd, setYearEnd] = useState(2024);
    const [selectedTypes, setSelectedTypes] = useState<ConflictType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedConflict, setSelectedConflict] = useState<ConflictListItem | null>(null);

    const filters: ConflictFilters = {
        year_start: yearStart,
        year_end: yearEnd,
        conflict_type: selectedTypes.length > 0 ? selectedTypes : undefined,
        search: searchQuery || undefined,
    };

    const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
        queryKey: ["conflicts", filters],
        queryFn: () => getConflicts(filters, 1, 100),
    });

    const { data: geoJsonData } = useQuery({
        queryKey: ["conflicts-geojson", yearStart, yearEnd],
        queryFn: () => getConflictsGeoJSON(yearStart, yearEnd),
    });

    const { data: stats } = useQuery({
        queryKey: ["stats-summary"],
        queryFn: getStatsSummary,
    });



    const toggleType = useCallback((type: ConflictType) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    }, []);

    return (
        <div className="h-screen pt-16 flex bg-[#0a0a0c]">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
                {/* Stats header */}
                {stats && (
                    <div className="p-6 border-b border-white/5 bg-[#8b0000]/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-2xl font-light text-white">{stats.total_conflicts}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Events</p>
                            </div>
                            <div>
                                <p className="text-2xl font-light text-[#8b0000]">{formatNumber(stats.total_casualties_best || 0)}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Lives Lost</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="p-6 border-b border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-6">Filters</p>

                    {/* Year range */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-white/60 mb-3">
                            <span>{yearStart}</span>
                            <span>{yearEnd}</span>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min={1000}
                                max={2024}
                                value={yearStart}
                                onChange={(e) => setYearStart(Number(e.target.value))}
                                className="w-full accent-[#8b0000]"
                            />
                            <input
                                type="range"
                                min={1000}
                                max={2024}
                                value={yearEnd}
                                onChange={(e) => setYearEnd(Number(e.target.value))}
                                className="w-full accent-[#8b0000]"
                            />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search conflicts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm rounded focus:outline-none focus:border-[#8b0000]/50 placeholder:text-white/30"
                        />
                    </div>

                    {/* Conflict types */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">Event Types</p>
                        <div className="flex flex-wrap gap-1.5">
                            {CONFLICT_TYPES.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={`text-[10px] px-2.5 py-1.5 rounded transition-all ${selectedTypes.includes(type)
                                        ? "bg-[#8b0000]/40 text-white border border-[#8b0000]/50"
                                        : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                                        }`}
                                >
                                    {getConflictTypeLabel(type)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Conflict list */}
                <div className="flex-1 overflow-y-auto">
                    {conflictsLoading ? (
                        <div className="p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="mb-4 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : conflictsData?.items.length === 0 ? (
                        <div className="p-6 text-center text-white/30 text-sm">
                            No conflicts found
                        </div>
                    ) : (
                        <ul>
                            {conflictsData?.items.map((conflict) => (
                                <li key={conflict.id} className="border-b border-white/5">
                                    <button
                                        onClick={() => setSelectedConflict(conflict)}
                                        className={`w-full text-left p-4 hover:bg-white/[0.02] transition-colors ${selectedConflict?.id === conflict.id ? "bg-white/[0.03] border-l-2 border-[#8b0000]" : ""
                                            }`}
                                    >
                                        <h4 className="text-sm font-medium text-white/90 line-clamp-1 mb-1">
                                            {conflict.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[10px] text-white/40">
                                            <span>{formatDateRange(conflict.start_date, conflict.end_date)}</span>
                                            {conflict.casualties_best && (
                                                <span className="text-[#8b0000]">{formatNumber(conflict.casualties_best)}</span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Count */}
                {conflictsData && (
                    <div className="p-4 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">
                            Showing {conflictsData.items.length} of {conflictsData.total} events
                        </p>
                    </div>
                )}
            </aside>

            {/* Map */}
            <div className="flex-1 relative">
                <MapExplorer
                    geoJsonData={geoJsonData}
                    onSelectConflict={(id) => {
                        const conflict = conflictsData?.items.find((c) => c.id === id);
                        if (conflict) setSelectedConflict(conflict);
                    }}
                    onLoad={() => setMapReady(true)}
                />

                {/* Loading overlay */}
                {!mapReady && (
                    <div className="absolute inset-0 bg-[#0a0a0c] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-[#8b0000] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                            <p className="text-sm text-white/40">Loading map...</p>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-[#0a0a0c]/95 border border-white/10 p-4 rounded backdrop-blur-sm">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Legend</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {CONFLICT_TYPES.slice(0, 6).map((type) => (
                            <div key={type} className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: getConflictTypeColor(type) }}
                                />
                                <span className="text-[10px] text-white/50">{getConflictTypeLabel(type)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Marker count */}
                {geoJsonData && (
                    <div className="absolute top-6 left-6 bg-[#0a0a0c]/90 border border-white/10 px-4 py-2 rounded">
                        <p className="text-sm text-white">
                            <span className="text-[#8b0000] font-medium">{geoJsonData.features.length}</span>
                            <span className="text-white/50 ml-2">markers on map</span>
                        </p>
                    </div>
                )}

                {/* Selected conflict panel */}
                <AnimatePresence>
                    {selectedConflict && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-6 right-6 w-80 bg-[#0a0a0c]/95 border border-white/10 p-6 rounded backdrop-blur-sm"
                        >
                            <button
                                onClick={() => setSelectedConflict(null)}
                                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                                {formatDateRange(selectedConflict.start_date, selectedConflict.end_date)}
                            </p>

                            <h3 className="text-xl font-light mb-3 pr-6">
                                {selectedConflict.title}
                            </h3>

                            {selectedConflict.primary_region && (
                                <p className="text-sm text-white/50 mb-4">
                                    {selectedConflict.primary_region}
                                </p>
                            )}

                            {selectedConflict.casualties_best && (
                                <div className="bg-[#8b0000]/20 border-l-2 border-[#8b0000] p-4 mb-4">
                                    <p className="text-3xl font-light text-[#8b0000]">
                                        {formatNumber(selectedConflict.casualties_best)}
                                    </p>
                                    <p className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Estimated casualties</p>
                                </div>
                            )}

                            <a
                                href={`/conflict/${selectedConflict.slug}`}
                                className="block w-full text-center py-3 border border-white/20 text-sm text-white/70 hover:bg-white/5 transition-colors"
                            >
                                View Details
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
