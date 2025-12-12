"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getConflictBySlug } from "@/lib/api";
import { formatDateRange, formatNumber, getConflictTypeColor, getConflictTypeLabel } from "@/lib/utils";
import type { ConflictDetail } from "@/types";

export default function ConflictDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const { data: conflict, isLoading, isError } = useQuery({
        queryKey: ["conflict", slug],
        queryFn: () => getConflictBySlug(slug),
        enabled: !!slug,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#8b0000] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                    <p className="text-sm text-white/40">Loading history...</p>
                </div>
            </div>
        );
    }

    if (isError || !conflict) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-light text-white mb-4">Conflict Not Found</h1>
                    <p className="text-white/40 mb-8">This event does not appear in our archives.</p>
                    <Link
                        href="/explorer"
                        className="px-6 py-3 border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
                    >
                        Return to Explorer
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] pt-24 pb-24">
            <div className="max-w-4xl mx-auto px-6">
                {/* Back Link */}
                <Link
                    href="/explorer"
                    className="inline-flex items-center text-sm text-white/40 hover:text-white mb-12 transition-colors group"
                >
                    <svg
                        className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Explorer
                </Link>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <span
                            className="px-3 py-1 rounded text-[10px] uppercase tracking-widest text-white/80 border border-white/10"
                            style={{
                                backgroundColor: `${getConflictTypeColor(conflict.conflict_type)}20`,
                                borderColor: `${getConflictTypeColor(conflict.conflict_type)}40`,
                            }}
                        >
                            {getConflictTypeLabel(conflict.conflict_type)}
                        </span>
                        <span className="text-sm font-light text-white/40 tracking-widest uppercase">
                            {formatDateRange(conflict.start_date, conflict.end_date)}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-light text-white mb-8 leading-tight">
                        {conflict.title}
                    </h1>

                    <div className="flex flex-wrap gap-12 pt-8 border-t border-white/10">
                        {conflict.casualties_best && (
                            <div>
                                <p className="text-3xl font-light text-[#8b0000]">
                                    {formatNumber(conflict.casualties_best)}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">
                                    Estimated Casualties
                                </p>
                            </div>
                        )}
                        {conflict.primary_region && (
                            <div>
                                <p className="text-3xl font-light text-white/80">
                                    {conflict.primary_region}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">
                                    Primary Region
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-12"
                >
                    <div className="md:col-span-2 space-y-8">
                        <div className="prose prose-invert prose-lg max-w-none">
                            <h3 className="text-lg font-light text-white/80 border-l-2 border-[#8b0000] pl-4 mb-6">
                                Description
                            </h3>
                            <p className="text-white/60 leading-relaxed whitespace-pre-line">
                                {conflict.description ||
                                    "Detailed historical account for this conflict is currently being compiled from archival sources. Please check back later for the full narrative."}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Side Panel Info */}
                        <div className="bg-white/5 p-6 rounded border border-white/5">
                            <h4 className="text-[10px] uppercase tracking-wider text-white/30 mb-4">
                                Data Sources
                            </h4>
                            {conflict.sources && conflict.sources.length > 0 ? (
                                <ul className="space-y-3">
                                    {conflict.sources.map((source, i) => (
                                        <li key={i} className="text-sm text-white/70">
                                            <p className="font-medium text-white/90">{source.title || source.citation_text || "Source"}</p>
                                            {source.url && (
                                                <a href={source.url} className="text-xs text-[#8b0000] hover:underline" target="_blank" rel="noreferrer">
                                                    {source.url}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-white/30 italic">
                                    Primary sources pending citation
                                </p>
                            )}
                        </div>
                        <div className="bg-[#8b0000]/10 border border-[#8b0000]/30 p-4 rounded">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">Content Advisory</p>
                            <p className="text-sm text-white/70">
                                This entry may describe violence, famine, or war. Reader discretion advised.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
