"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getStatsSummary } from "@/lib/api";
import StatsChart from "@/components/StatsChart";

// High-quality historical images for slideshow
const SLIDESHOW_IMAGES = [
    {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/South_Asia_%28orthographic_projection%29.svg/800px-South_Asia_%28orthographic_projection%29.svg.png",
        alt: "South Asia",
        caption: "The Indian Subcontinent",
    },
    {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Mughal_Historical_Map.png/800px-Mughal_Historical_Map.png",
        alt: "Mughal Empire",
        caption: "The Mughal Empire at its zenith",
    },
    {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/British_Indian_Empire_1909_Imperial_Gazetteer_of_India.jpg/1024px-British_Indian_Empire_1909_Imperial_Gazetteer_of_India.jpg",
        alt: "British India",
        caption: "British India, 1909",
    },
    {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Partition_of_India_1947_en.svg/560px-Partition_of_India_1947_en.svg.png",
        alt: "Partition",
        caption: "The Partition of India, 1947",
    },
    {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/India_Gate_in_New_Delhi_03-2016.jpg/1024px-India_Gate_in_New_Delhi_03-2016.jpg",
        alt: "India Gate",
        caption: "India Gate, New Delhi",
    },
];

export default function HomePage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance slideshow
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);
    const { data: stats } = useQuery({ queryKey: ["stats-summary"], queryFn: getStatsSummary });

    return (
        <div className="min-h-screen bg-[#0a0a0c]">
            {/* Hero Section with Slideshow */}
            <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background slideshow */}
                <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.3, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 2 }}
                            className="absolute inset-0"
                        >
                            <img
                                src={SLIDESHOW_IMAGES[currentSlide].src}
                                alt={SLIDESHOW_IMAGES[currentSlide].alt}
                                className="w-full h-full object-cover grayscale"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dark overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0a0a0c]/70 to-[#0a0a0c]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c]" />

                {/* Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)]" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    {/* Caption */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-[10px] uppercase tracking-[0.5em] text-white/40 mb-10"
                    >
                        A Visual History
                    </motion.p>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight mb-4"
                    >
                        The Conflicts of
                    </motion.h1>
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight text-[#8b0000] mb-10"
                    >
                        South Asia
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        One thousand years of wars, invasions, famines, and resistance.
                        <br />
                        Documented with care. Visualized with precision.
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                    >
                        <Link
                            href="/story"
                            className="inline-block px-12 py-5 bg-[#8b0000] text-white text-lg font-light tracking-wide hover:bg-[#a00000] transition-all duration-500 hover:px-16"
                        >
                            Begin Journey
                        </Link>
                    </motion.div>

                    {/* Slide indicator with caption */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-16"
                    >
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentSlide}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-xs text-white/30 mb-4"
                            >
                                {SLIDESHOW_IMAGES[currentSlide].caption}
                            </motion.p>
                        </AnimatePresence>
                        <div className="flex justify-center gap-2">
                            {SLIDESHOW_IMAGES.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-8 h-1 transition-all duration-500 ${index === currentSlide
                                        ? "bg-[#8b0000]"
                                        : "bg-white/20 hover:bg-white/40"
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2"
                >
                    <div className="w-px h-20 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
                </motion.div>
            </section>

            {/* Content Warning */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
                    <div className="border-l-2 border-[#8b0000] bg-[#8b0000]/5 p-8">
                        <h3 className="text-lg font-light mb-4 text-white/80">Content Advisory</h3>
                        <p className="text-white/50 text-sm leading-relaxed">
                            This project documents historical violence including wars, massacres,
                            famines, and other tragic events. The content is presented for educational
                            purposes with respect for all victims and their descendants.
                        </p>
                    </div>
                </div>
            </section>

            {/* Navigation Cards */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                    <div className="grid md:grid-cols-3 gap-px bg-white/5">
                        {/* Story */}
                        <Link
                            href="/story"
                            className="group bg-[#0a0a0c] p-12 hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b0000]/0 to-[#8b0000]/0 group-hover:from-[#8b0000]/5 group-hover:to-transparent transition-all duration-700" />
                            <div className="relative">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">01</p>
                                <h3 className="text-3xl font-extralight mb-4 group-hover:text-[#8b0000] transition-colors">
                                    Story Mode
                                </h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    A scroll-driven narrative through a millennium of South Asian history.
                                    From the Afghan invasions to modern day.
                                </p>
                                <div className="mt-10 flex items-center gap-4">
                                    <div className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-[#8b0000] transition-all duration-500" />
                                    <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Enter</span>
                                </div>
                            </div>
                        </Link>

                        {/* Explorer */}
                        <Link
                            href="/explorer"
                            className="group bg-[#0a0a0c] p-12 hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b0000]/0 to-[#8b0000]/0 group-hover:from-[#8b0000]/5 group-hover:to-transparent transition-all duration-700" />
                            <div className="relative">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">02</p>
                                <h3 className="text-3xl font-extralight mb-4 group-hover:text-[#8b0000] transition-colors">
                                    Map Explorer
                                </h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    An interactive map with timeline controls. Filter by era,
                                    conflict type, region, and casualties.
                                </p>
                                <div className="mt-10 flex items-center gap-4">
                                    <div className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-[#8b0000] transition-all duration-500" />
                                    <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Enter</span>
                                </div>
                            </div>
                        </Link>

                        {/* Data */}
                        <Link
                            href="/data"
                            className="group bg-[#0a0a0c] p-12 hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b0000]/0 to-[#8b0000]/0 group-hover:from-[#8b0000]/5 group-hover:to-transparent transition-all duration-700" />
                            <div className="relative">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">03</p>
                                <h3 className="text-3xl font-extralight mb-4 group-hover:text-[#8b0000] transition-colors">
                                    Raw Data
                                </h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    Browse the complete dataset. Download for research.
                                    Understand our methodology and sources.
                                </p>
                                <div className="mt-10 flex items-center gap-4">
                                    <div className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-[#8b0000] transition-all duration-500" />
                                    <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Enter</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-32 border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
                    {stats && (
                        <StatsChart data={[
                            { label: "Events Documented", value: stats.total_conflicts },
                            { label: "Lives Lost (M)", value: Math.round((stats.total_casualties_best || 0) / 1000000) },
                            { label: "Years Covered", value: 1024 },
                        ]} />
                    )}
                </div>
            </section>

            {/* About */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-12 max-w-3xl text-center">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-8">About This Project</p>

                    <p className="text-xl text-white/50 leading-relaxed mb-16">
                        Red SubContinent documents historical conflicts across India, Pakistan,
                        Bangladesh, Afghanistan, and neighboring regions from 1000 CE to the present day.
                    </p>

                    <div className="grid md:grid-cols-3 gap-12 text-left">
                        <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-[#8b0000] mb-4">Source-Driven</h4>
                            <p className="text-white/40 text-sm leading-relaxed">
                                Every event is linked to verifiable sources. Wikipedia, academic databases,
                                and historical records.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-[#8b0000] mb-4">Uncertainty-First</h4>
                            <p className="text-white/40 text-sm leading-relaxed">
                                Casualty figures include ranges. We show what is known,
                                what is estimated, and what remains uncertain.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-[#8b0000] mb-4">Neutral</h4>
                            <p className="text-white/40 text-sm leading-relaxed">
                                No political agenda. No glorification. A careful documentation
                                of historical events with respect for all affected.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-12 text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
                        An open educational project
                    </p>
                </div>
            </footer>
        </div>
    );
}
