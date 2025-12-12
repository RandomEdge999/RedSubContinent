/**
 * API client for the Red SubContinent backend.
 */

import type {
    ConflictDetail,
    ConflictFilters,
    ConflictListItem,
    GeoJSONCollection,
    PaginatedResponse,
    StatsSummary,
    TimelinePoint,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const performFetch = async () =>
        fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            signal: controller.signal,
        });

    const maxRetries = options?.method && options.method !== "GET" ? 0 : 2;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= maxRetries) {
        try {
            response = await performFetch();
            break;
        } catch (err: any) {
            attempt += 1;
            if (attempt > maxRetries) {
                clearTimeout(timeout);
                throw new Error(`Network error: ${err?.message || "unknown"}`);
            }
            const backoff = 200 * attempt;
            await new Promise((res) => setTimeout(res, backoff));
        }
    }

    clearTimeout(timeout);

    if (!response) {
        throw new Error("No response received");
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Build query string from filters.
 */
function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
        } else {
            searchParams.append(key, String(value));
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

// ============= Conflicts API =============

/**
 * Fetch paginated list of conflicts.
 */
export async function getConflicts(
    filters?: ConflictFilters,
    page = 1,
    pageSize = 50
): Promise<PaginatedResponse<ConflictListItem>> {
    const query = buildQueryString({
        page,
        page_size: pageSize,
        year_start: filters?.year_start,
        year_end: filters?.year_end,
        conflict_type: filters?.conflict_type,
        min_casualties: filters?.min_casualties,
        max_casualties: filters?.max_casualties,
        region: filters?.region,
        search: filters?.search,
    });

    return fetchAPI<PaginatedResponse<ConflictListItem>>(`/api/conflicts${query}`);
}

/**
 * Fetch single conflict by ID.
 */
export async function getConflictById(id: string): Promise<ConflictDetail> {
    return fetchAPI<ConflictDetail>(`/api/conflicts/${id}`);
}

/**
 * Fetch single conflict by slug.
 */
export async function getConflictBySlug(slug: string): Promise<ConflictDetail> {
    return fetchAPI<ConflictDetail>(`/api/conflicts/by-slug/${slug}`);
}

/**
 * Fetch conflicts as GeoJSON for map display.
 */
export async function getConflictsGeoJSON(
    yearStart?: number,
    yearEnd?: number
): Promise<GeoJSONCollection> {
    const query = buildQueryString({
        year_start: yearStart,
        year_end: yearEnd,
    });

    return fetchAPI<GeoJSONCollection>(`/api/conflicts/geojson${query}`);
}

/**
 * Fetch timeline data.
 */
export async function getTimeline(
    yearStart = 1000,
    yearEnd = 2024,
    granularity: "year" | "decade" | "century" = "decade"
): Promise<TimelinePoint[]> {
    const query = buildQueryString({
        year_start: yearStart,
        year_end: yearEnd,
        granularity,
    });

    return fetchAPI<TimelinePoint[]>(`/api/conflicts/timeline${query}`);
}

// ============= Stats API =============

/**
 * Fetch overall statistics.
 */
export async function getStatsSummary(): Promise<StatsSummary> {
    return fetchAPI<StatsSummary>("/api/stats/summary");
}

/**
 * Fetch statistics by region.
 */
export async function getStatsByRegion(): Promise<
    Array<{ region: string; conflict_count: number; total_casualties: number }>
> {
    return fetchAPI("/api/stats/by-region");
}

/**
 * Fetch statistics by decade for a specific century.
 */
export async function getStatsByDecade(
    century: number
): Promise<Array<{ decade: number; conflict_count: number; total_casualties: number }>> {
    return fetchAPI(`/api/stats/by-decade?century=${century}`);
}

// ============= Actors API =============

/**
 * Fetch list of actors.
 */
export async function getActors(
    limit = 100
): Promise<Array<{ name: string; role: string; appearance_count: number }>> {
    return fetchAPI(`/api/actors?limit=${limit}`);
}

/**
 * Search actors by name.
 */
export async function searchActors(
    query: string,
    limit = 20
): Promise<Array<{ name: string; role: string; appearance_count: number }>> {
    return fetchAPI(`/api/actors/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}
