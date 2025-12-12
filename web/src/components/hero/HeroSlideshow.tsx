"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageWithFallback from "@/components/ImageWithFallback";

export interface SlideData {
    src: string;
    alt: string;
    caption: string;
}

interface HeroSlideshowProps {
    images: SlideData[];
    interval?: number;
    children: ReactNode;
}

export default function HeroSlideshow({ images, interval = 6000, children }: HeroSlideshowProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, interval);
        return () => clearInterval(timer);
    }, [images.length, interval]);

    return (
        <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Slideshow */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0"
                    >
                        <ImageWithFallback
                            src={images[currentSlide].src}
                            alt={images[currentSlide].alt}
                            fill
                            className="object-cover grayscale"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0a0a0c]/70 to-[#0a0a0c] z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c] z-0 pointer-events-none" />

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] z-0 pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                {children}

                {/* Slideshow Controls & Caption */}
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
                            {images[currentSlide].caption}
                        </motion.p>
                    </AnimatePresence>
                    <div className="flex justify-center gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-8 h-1 transition-all duration-500 ${index === currentSlide
                                        ? "bg-[#8b0000]"
                                        : "bg-white/20 hover:bg-white/40"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
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
                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
            >
                <div className="w-px h-20 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
            </motion.div>
        </section>
    );
}
