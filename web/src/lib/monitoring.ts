import { useEffect } from "react";

export function useInitMonitoring() {
    useEffect(() => {
        const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
        if (!dsn) return;

        // Dynamically import to avoid bundling when unused
        import("@sentry/nextjs")
            .then((Sentry) => {
                if ((Sentry as any).getCurrentHub().getClient()) return;
                Sentry.init({
                    dsn,
                    tracesSampleRate: 0.2,
                    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
                    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
                });
            })
            .catch((err) => {
                console.error("Failed to init Sentry", err);
            });
    }, []);
}
