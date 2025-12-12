"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

import { imageProxyLoader } from "@/app/utils/imageProxyLoader";
import { fetchExternalImage } from "@/app/utils/fetchExternalImage";

interface ImageWithFallbackProps extends Omit<ImageProps, "loader"> {
    /** Optional local placeholder image used when no external fallback can be found */
    fallbackSrc?: string;
}

export default function ImageWithFallback({
    src,
    alt = "",
    fallbackSrc = "/placeholder.png",
    className,
    ...props
}: ImageWithFallbackProps) {
    const isTest = typeof process !== "undefined" && Boolean(process.env.JEST_WORKER_ID);
    const [currentSrc, setCurrentSrc] = useState<any>(src as any);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Reset when src changes
    useEffect(() => {
        setCurrentSrc(src);
        setLoading(true);
        setHasError(false);
    }, [src]);

    const handleError = async () => {
        // Try to fetch a related image from Wikipedia using the alt text as search term
        const wikiImg = await fetchExternalImage(alt);
        if (wikiImg) {
            setCurrentSrc(wikiImg);
        } else {
            setCurrentSrc(fallbackSrc);
        }
        setHasError(true);
        setLoading(false);
    };

    const safeAlt = alt || "";

    const baseProps: any = {
        ...props,
        alt: safeAlt,
        src: currentSrc,
        className: `transition-all duration-700 ease-in-out ${loading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"}`,
        onLoad: () => setLoading(false),
        onError: handleError,
    };

    if (!isTest && !hasError) {
        baseProps.loader = imageProxyLoader;
        baseProps.unoptimized = false;
    } else {
        // Strip Next-specific props when running under the JSDOM img mock to avoid warnings
        delete baseProps.loader;
        delete baseProps.fill;
        delete baseProps.priority;
        delete baseProps.blurDataURL;
        delete baseProps.placeholder;
        delete baseProps.unoptimized;
    }

    return (
        <div className={`relative overflow-hidden ${className ?? ""}`}>
            <Image {...baseProps} alt={safeAlt} />
            {loading && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
        </div>
    );
}
