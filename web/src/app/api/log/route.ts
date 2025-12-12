import { NextRequest, NextResponse } from "next/server";

type LogPayload = {
    message: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    release?: string;
    env?: string;
    level?: string;
};

const RATE_LIMIT_MAX = 30; // per IP per minute
const buckets: Record<string, number[]> = {};

export async function POST(req: NextRequest) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

    // simple rate limit
    const now = Date.now();
    const windowStart = now - 60_000;
    const bucket = (buckets[ip] || []).filter((ts) => ts >= windowStart);
    if (bucket.length >= RATE_LIMIT_MAX) {
        return NextResponse.json({ ok: false, detail: "rate limited" }, { status: 429 });
    }

    const payload = (await req.json().catch(() => null)) as LogPayload | null;
    if (!payload || !payload.message) {
        return NextResponse.json({ ok: false, detail: "invalid payload" }, { status: 400 });
    }

    bucket.push(now);
    buckets[ip] = bucket;

    // Write structured log to stdout; Promtail/Loki can scrape container logs.
    const logLine = {
        source: "web-client",
        level: payload.level || "error",
        message: payload.message,
        stack: payload.stack,
        url: payload.url,
        userAgent: payload.userAgent,
        release: payload.release,
        env: payload.env,
        ip,
        ts: new Date(now).toISOString(),
    };
    console.error(JSON.stringify(logLine));

    return NextResponse.json({ ok: true });
}

export function GET() {
    return NextResponse.json({ ok: true, detail: "POST error logs here" });
}
