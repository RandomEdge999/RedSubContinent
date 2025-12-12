"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { imageProxyLoader } from "@/app/utils/imageProxyLoader";

import { TimelineNav } from "./TimelineNav";
import TimelineIndicator from "./TimelineIndicator";
import ImageWithFallback from "../ImageWithFallback";

import { getTimeline, getStatsSummary } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

// High quality reliable images from Wikimedia Commons
const CHAPTER_IMAGES = [
    {
        id: "intro",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/South_Asia_%28orthographic_projection%29.svg/600px-South_Asia_%28orthographic_projection%29.svg.png",
        alt: "South Asia Map"
    },
    {
        id: "invasions",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Ghaznavid_Empire_997_-_1030_%28CE%29.png/800px-Ghaznavid_Empire_997_-_1030_%28CE%29.png",
        alt: "Ghaznavid Empire"
    },
    {
        id: "sultanate",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Qutub_Minar_in_Delhi.jpg/800px-Qutub_Minar_in_Delhi.jpg",
        alt: "Qutub Minar"
    },
    {
        id: "mughals",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Mughal_Historical_Map.png/800px-Mughal_Historical_Map.png",
        alt: "Mughal Empire Map"
    },
    {
        id: "marathas",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Indian_Rebellion_of_1857.png/800px-Indian_Rebellion_of_1857.png",
        alt: "Maratha Confederacy"
    },
    {
        id: "company",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/British_Indian_Empire_1909_Imperial_Gazetteer_of_India.jpg/1024px-British_Indian_Empire_1909_Imperial_Gazetteer_of_India.jpg",
        alt: "British India Map"
    },
    {
        id: "raj",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/1943_Famine.jpg/440px-1943_Famine.jpg",
        alt: "Bengal Famine"
    },
    {
        id: "partition",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Partition_of_India_1947_en.svg/560px-Partition_of_India_1947_en.svg.png",
        alt: "Partition Map"
    },
    {
        id: "modern",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/India_Gate_in_New_Delhi_03-2016.jpg/1024px-India_Gate_in_New_Delhi_03-2016.jpg",
        alt: "India Gate"
    },
];

// Full chapter data
const chapters = [
    {
        id: "intro",
        era: "1000 CE",
        title: "The Second Millennium Begins",
        content: `The Indian subcontinent enters the year 1000 as a mosaic of powerful kingdoms. The Chola Empire dominates the south, its navy reaching Southeast Asia. Rajput confederacies guard the northern plains. Beyond the mountain passes, the Ghaznavid Empire eyes the wealthy cities of the Gangetic plain.`,
        fact: "Over 200 distinct kingdoms existed across South Asia",
    },
    {
        id: "invasions",
        era: "1000-1206",
        title: "The Afghan Invasions",
        content: `Mahmud of Ghazni launches seventeen devastating raids into India between 997 and 1030. Temples are sacked at Somnath, Mathura, and Kannauj. Treasuries emptied. Thousands enslaved. These are not conquests but campaigns of systematic extraction. The wealth of India flows westward.`,
        fact: "17 raids by Mahmud of Ghazni extracted billions in treasure",
    },
    {
        id: "sultanate",
        era: "1206-1526",
        title: "The Delhi Sultanate",
        content: `For over three centuries, five successive dynasties rule from Delhi: Mamluk, Khalji, Tughlaq, Sayyid, and Lodi. The Sultanate repels devastating Mongol invasions that might have changed history. Timur's sack of Delhi in 1398 kills perhaps 100,000 and leaves the empire a shadow.`,
        fact: "Timur's invasion killed an estimated 100,000 in Delhi alone",
    },
    {
        id: "mughals",
        era: "1526-1707",
        title: "The Mughal Empire",
        content: `Babur's victory at Panipat in 1526 establishes a dynasty that will rule for three centuries. Under Akbar, the empire reaches its administrative zenith. But Aurangzeb's 27-year Deccan campaign drains the treasury and fractures the realm forever.`,
        fact: "The Mughal Empire had a GDP of 25% of world economy at its peak",
    },
    {
        id: "marathas",
        era: "1674-1818",
        title: "The Maratha Confederacy",
        content: `From the hills of the western Deccan, Shivaji forges a new Hindu kingdom in defiance of Mughal power. His successors create a confederacy stretching from Attock to Orissa. At Panipat in 1761, the Marathas meet catastrophic defeat. Perhaps 100,000 die in a single day.`,
        fact: "Third Battle of Panipat: 100,000+ casualties in one day",
    },
    {
        id: "company",
        era: "1757-1857",
        title: "Company Rule",
        content: `A trading company becomes a territorial power. Plassey. Buxar. Mysore. The Marathas. One by one, Indian states fall to Company armies. The Great Bengal Famine of 1770 kills 10 million. The 1857 uprising shakes British rule and results in mass reprisals.`,
        fact: "Bengal Famine of 1770: 10 million deaths (one-third of Bengal)",
    },
    {
        id: "raj",
        era: "1858-1947",
        title: "The British Raj",
        content: `The Crown takes direct control after 1857. Railways connect cities but also facilitate famine by enabling grain exports during shortages. World Wars drain Indian resources. The Bengal Famine of 1943 kills 2-3 million. The independence movement grows from petition to revolution.`,
        fact: "British-era famines: 30-60 million total deaths",
    },
    {
        id: "partition",
        era: "1947",
        title: "Partition",
        content: `At midnight on August 15, 1947, two nations are born in blood. The largest mass migration in human history unfolds. Fifteen million people displaced. Cities divided. Families separated. Estimates of the dead range from 200,000 to 2 million. Punjab and Bengal bear the worst.`,
        fact: "15 million displaced, 200,000 - 2,000,000 killed",
    },
    {
        id: "modern",
        era: "1947-Present",
        title: "Nations at War and Peace",
        content: `Three major wars between India and Pakistan: 1947, 1965, 1971. The liberation of Bangladesh. Kashmir remains contested, with insurgency since 1989. Both nations acquire nuclear weapons. But also: growing democracies, economic transformation, and the long work of building.`,
        fact: "4 major Indo-Pakistani wars, 2 nuclear powers",
    },
];

export function StoryContainer() {
    const [activeChapter, setActiveChapter] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const chapterRefs = useRef<(HTMLElement | null)[]>([]);

    const { data: stats } = useQuery({
        queryKey: ["stats-summary"],
        queryFn: getStatsSummary,
    });

    const { data: timeline } = useQuery({
        queryKey: ["timeline-century"],
        queryFn: () => getTimeline(1000, 2024, "century"),
    });

    // Intersection Observer for scroll-driven chapter changes
    useEffect(() => {
        const observers = chapterRefs.current.map((ref, index) => {
            if (!ref) return null;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
                            setActiveChapter(index);
                        }
                    });
                },
                { threshold: 0.4, rootMargin: "-10% 0px -10% 0px" }
            );

            observer.observe(ref);
            return observer;
        });

        return () => {
            observers.forEach((observer) => observer?.disconnect());
        };
    }, []);

    const scrollToChapter = (index: number) => {
        chapterRefs.current[index]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

    return (
        <div ref={containerRef} className="bg-[#0a0a0c] min-h-screen">
            {/* FIXED: Timeline navigation - LEFT SIDE - Perfect vertical alignment */}
            {/* FIXED: Timeline navigation - LEFT SIDE - Perfect vertical alignment */}
            {/* Refined Timeline Navigation */}
            <TimelineNav
                chapters={chapters.map(c => ({ id: c.id, era: c.era }))}
                activeChapter={activeChapter}
                onChapterClick={scrollToChapter}
            />

            {/* NEW: Visual Timeline Indicator - RIGHT SIDE */}
            <TimelineIndicator
                totalSteps={chapters.length}
                currentStep={activeChapter}
                onStepClick={scrollToChapter}
            />

            {/* Era indicator - RIGHT SIDE - Bottom aligned */}
            <aside className="hidden lg:block fixed right-8 bottom-8 z-40">
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Era</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeChapter}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="text-4xl font-light text-[#8b0000]"
                        >
                            {chapters[activeChapter]?.era}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </aside>

            {/* Main content */}
            <div className="max-w-4xl mx-auto px-6 lg:px-12 lg:ml-32">
                {/* Hero section */}
                <section className="min-h-screen flex flex-col items-center justify-center text-center py-24 pt-32">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-8"
                    >
                        An Interactive History
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-light tracking-tight mb-4"
                    >
                        A Thousand
                    </motion.h1>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-5xl md:text-7xl font-light tracking-tight text-[#8b0000] mb-12"
                    >
                        Years
                    </motion.h1>

                    {stats && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="grid grid-cols-3 gap-12 mb-16"
                        >
                            <div className="text-center">
                                <p className="text-5xl md:text-6xl font-extralight text-white/90">
                                    {stats.total_conflicts}
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-2">Events</p>
                            </div>
                            <div className="text-center">
                                <p className="text-5xl md:text-6xl font-extralight text-white/90">
                                    {Math.round((stats.total_casualties_best || 0) / 1000000)}M
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-2">Lives Lost</p>
                            </div>
                            <div className="text-center">
                                <p className="text-5xl md:text-6xl font-extralight text-white/90">
                                    1024
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-2">Years Span</p>
                            </div>
                        </motion.div>
                    )}

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-lg text-white/40 max-w-lg leading-relaxed"
                    >
                        Scroll to journey through the conflicts, conquests, and resistance movements that shaped South Asia.
                    </motion.p>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="mt-20 flex flex-col items-center"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">Scroll</p>
                        <div className="w-px h-16 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
                    </motion.div>
                </section>

                {/* Chapters */}
                {chapters.map((chapter, index) => {
                    const image = CHAPTER_IMAGES.find(img => img.id === chapter.id);

                    return (
                        <motion.section
                            key={chapter.id}
                            ref={(el) => { chapterRefs.current[index] = el; }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true, margin: "-20%" }}
                            className="min-h-screen flex flex-col justify-center py-32"
                        >
                            {/* Era badge */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                                    {chapter.era}
                                </span>
                            </div>

                            {/* Image */}
                            {image && (
                                <div className="relative mb-12 overflow-hidden rounded-sm aspect-video bg-white/5">
                                    <ImageWithFallback
                                        src={image.url}
                                        alt={image.alt}
                                        fill
                                        className="object-cover opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        loading="lazy"
                                        fallbackSrc="/placeholder.png"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/30 pointer-events-none" />
                                </div>
                            )}

                            {/* Title */}
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight mb-8">
                                {chapter.title}
                            </h2>

                            {/* Content */}
                            <p className="text-xl text-white/50 leading-relaxed mb-8 max-w-2xl">
                                {chapter.content}
                            </p>

                            {/* Key Fact */}
                            {chapter.fact && (
                                <div className="border-l-2 border-[#8b0000] pl-6 py-2">
                                    <p className="text-sm text-[#8b0000]">{chapter.fact}</p>
                                </div>
                            )}
                        </motion.section>
                    );
                })}

                {/* Timeline visualization */}
                {timeline && timeline.length > 0 && (
                    <section className="py-32">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Data</p>
                        <h2 className="text-3xl font-light mb-12">Conflicts By Century</h2>

                        <div className="flex items-end justify-between gap-3 h-80">
                            {timeline.map((point, index) => {
                                const maxCount = Math.max(...timeline.map((t) => t.count));
                                const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;

                                return (
                                    <motion.div
                                        key={point.year}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${Math.max(height, 5)}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex-1 flex flex-col items-center group"
                                    >
                                        <div
                                            className="w-full bg-gradient-to-t from-[#8b0000] to-[#a00000] hover:from-[#a00000] hover:to-[#c00000] transition-colors rounded-t cursor-pointer relative"
                                            style={{ height: "100%" }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#1a1a1c] border border-white/10 rounded px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                <p className="text-lg font-light">{point.count}</p>
                                                <p className="text-xs text-white/50">events</p>
                                                <p className="text-2xs text-white/30 mt-1">{formatNumber(point.casualties)} casualties</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-white/30 mt-4 -rotate-45 origin-left whitespace-nowrap">
                                            {point.year}s
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Continue */}
                <section className="min-h-[60vh] flex flex-col items-center justify-center text-center py-24">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-8">Explore Further</p>

                    <h2 className="text-4xl md:text-5xl font-light mb-8">The Data Awaits</h2>

                    <p className="text-lg text-white/40 max-w-md mb-12">
                        Explore individual events on the interactive map, or examine the complete dataset.
                    </p>

                    <div className="flex gap-6">
                        <a href="/explorer" className="px-8 py-4 bg-[#8b0000] text-white font-medium hover:bg-[#a00000] transition-colors">
                            Open Map
                        </a>
                        <a href="/data" className="px-8 py-4 border border-white/20 text-white/70 hover:bg-white/5 transition-colors">
                            View Data
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
