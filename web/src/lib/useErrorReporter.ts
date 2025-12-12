"use client";

import { useEffect } from "react";

export function useErrorReporter() {
    useEffect(() => {
        const send = async (payload: Record<string, unknown>) => {
            try {
                await fetch("/api/log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    keepalive: true,
                });
            } catch {
                // ignore
            }
        };

        const handleError = (event: ErrorEvent) => {
            send({
                message: event.message,
                stack: event.error?.stack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
                env: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
            });
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            send({
                message: String(event.reason),
                stack: (event.reason && (event.reason.stack || event.reason.message)) || undefined,
                url: window.location.href,
                userAgent: navigator.userAgent,
                release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
                env: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
            });
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);
}
