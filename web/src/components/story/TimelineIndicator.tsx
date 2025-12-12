"use client";

import { motion } from "framer-motion";

interface TimelineIndicatorProps {
    totalSteps: number;
    currentStep: number;
    onStepClick: (index: number) => void;
}

export default function TimelineIndicator({
    totalSteps,
    currentStep,
    onStepClick,
}: TimelineIndicatorProps) {
    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onStepClick(i)}
                    className="group relative flex items-center justify-center w-4 h-4"
                    aria-label={`Go to chapter ${i + 1}`}
                >
                    <motion.div
                        className={`absolute rounded-full transition-colors duration-300 ${i === currentStep
                                ? "bg-[#8b0000] shadow-[0_0_10px_rgba(139,0,0,0.8)]"
                                : "bg-white/20 group-hover:bg-white/40"
                            }`}
                        initial={false}
                        animate={{
                            width: i === currentStep ? 12 : 6,
                            height: i === currentStep ? 12 : 6,
                        }}
                    />
                    {/* Tooltip on hover (optional enhancement) */}
                    <div className="absolute right-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/50 whitespace-nowrap pointer-events-none">
                        Chapter {i + 1}
                    </div>
                </button>
            ))}

            {/* Connecting line */}
            <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-white/5 -z-10" />
        </div>
    );
}
