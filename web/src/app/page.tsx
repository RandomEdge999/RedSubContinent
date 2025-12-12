"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getStatsSummary } from "@/lib/api";
import KeyMetrics from "@/components/KeyMetrics";
import TimelineChart from "@/components/TimelineChart";
import HeroSlideshow from "@/components/hero/HeroSlideshow";
// import Image from "next/image"; // restore Image for test

// High-quality historical images for slideshow
const SLIDESHOW_IMAGES = [
    { src: "/images/hero-1.svg", alt: "South Asia topography", caption: "The Indian Subcontinent" },
    { src: "/images/hero-2.svg", alt: "Cinematic crimson gradient", caption: "Empires rise and fall" },
    { src: "/images/hero-3.svg", alt: "Map grid motif", caption: "Borders and battle lines" },
];

export default function HomePage() {
    const { data: stats } = useQuery({ queryKey: ["stats-summary"], queryFn: getStatsSummary });
    // const stats = null; // Mock stats for now

    return (
        <div className="min-h-screen bg-[#0a0a0c]">
            {/* Hero Section with Slideshow */}
            <HeroSlideshow images={SLIDESHOW_IMAGES}>
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
            </HeroSlideshow>

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
            <section className="py-32 border-t border-white/5 bg-[#0a0a0c]">
                <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                    <div className="text-center mb-16">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">By The Numbers</p>
                        <h2 className="text-4xl lg:text-5xl font-extralight text-white">
                            A Millennium of <span className="text-[#8b0000]">Conflict</span>
                        </h2>
                    </div>

                    {stats && <KeyMetrics stats={stats} />}
                    <TimelineChart />
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
