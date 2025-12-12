"use client";

import { motion } from "framer-motion";

interface TimelineNavProps {
    chapters: { id: string; era: string }[];
    activeChapter: number;
    onChapterClick: (index: number) => void;
}

export function TimelineNav({ chapters, activeChapter, onChapterClick }: TimelineNavProps) {
    return (
        <nav className="hidden lg:flex fixed left-12 top-1/2 -translate-y-1/2 z-50 flex-col items-start">
            <div className="relative pl-8 border-l border-white/10 py-8">
                {chapters.map((chapter, index) => {
                    const isActive = index === activeChapter;
                    return (
                        <button
                            key={chapter.id}
                            onClick={() => onChapterClick(index)}
                            className="group flex items-center mb-12 last:mb-0 relative"
                        >
                            <div
                                className={`absolute -left-[37px] w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${isActive
                                        ? "bg-[#8b0000] border-[#8b0000] scale-125 shadow-[0_0_15px_rgba(139,0,0,0.6)]"
                                        : "bg-[#0a0a0c] border-white/30 group-hover:border-white/60"
                                    }`}
                            />
                            <span
                                className={`text-sm font-light tracking-widest transition-all duration-300 ${isActive
                                        ? "text-[#8b0000] translate-x-1"
                                        : "text-white/30 group-hover:text-white/60"
                                    }`}
                            >
                                {chapter.era}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
