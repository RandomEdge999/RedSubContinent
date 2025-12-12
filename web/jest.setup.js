import "@testing-library/jest-dom";

// Minimal polyfills for browser-only observers used in charts/animations.
if (typeof window !== "undefined") {
    class NoopObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    if (!window.ResizeObserver) {
        window.ResizeObserver = NoopObserver;
    }
    if (!window.IntersectionObserver) {
        window.IntersectionObserver = NoopObserver;
    }
}
