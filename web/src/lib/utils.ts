/**
 * Utility functions for the Red SubContinent application.
 */

import type { ConflictType } from "@/types";

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return "Unknown";
    return value.toLocaleString();
}

/**
 * Format casualty range for display.
 */
export function formatCasualties(
    low: number | null,
    high: number | null,
    best: number | null | undefined
): string {
    if (best !== null && best !== undefined) {
        if (low !== null && low !== undefined && high !== null && high !== undefined && low !== high) {
            return `~${formatNumber(best)} (${formatNumber(low)} - ${formatNumber(high)})`;
        }
        return formatNumber(best);
    }

    if (low !== null && low !== undefined && high !== null && high !== undefined) {
        return `${formatNumber(low)} - ${formatNumber(high)}`;
    }

    return "Unknown";
}

/**
 * Format a date range for display.
 */
export function formatDateRange(
    startDate: string | null,
    endDate: string | null
): string {
    if (!startDate) return "Date unknown";

    const start = new Date(startDate);
    const startYear = start.getFullYear();

    if (!endDate) return String(startYear);

    const end = new Date(endDate);
    const endYear = end.getFullYear();

    if (startYear === endYear) return String(startYear);

    return `${startYear}-${endYear}`;
}

/**
 * Get display label for conflict type.
 */
export function getConflictTypeLabel(type: ConflictType): string {
    const labels: Record<ConflictType, string> = {
        war: "War",
        invasion: "Invasion",
        massacre: "Massacre",
        riot: "Riot",
        famine: "Famine",
        partition_event: "Partition Event",
        uprising: "Uprising",
        imperial_campaign: "Imperial Campaign",
        civil_conflict: "Civil Conflict",
        communal_violence: "Communal Violence",
        other: "Other",
    };

    return labels[type] || type;
}

/**
 * Get CSS class for conflict type badge.
 */
export function getConflictTypeBadgeClass(type: ConflictType): string {
    const classes: Record<ConflictType, string> = {
        war: "badge-war",
        invasion: "badge-war",
        massacre: "badge-massacre",
        riot: "badge-riot",
        famine: "badge-famine",
        partition_event: "badge-massacre",
        uprising: "badge-uprising",
        imperial_campaign: "badge-war",
        civil_conflict: "badge-war",
        communal_violence: "badge-riot",
        other: "badge-default",
    };

    return classes[type] || "badge-default";
}

/**
 * Get color for conflict type (for charts/maps).
 */
export function getConflictTypeColor(type: ConflictType): string {
    const colors: Record<ConflictType, string> = {
        war: "#dc2626", // red-600
        invasion: "#b91c1c", // red-700
        massacre: "#8b0000", // blood-500
        riot: "#ca8a04", // yellow-600
        famine: "#d97706", // amber-600
        partition_event: "#991b1b", // red-800
        uprising: "#ea580c", // orange-600
        imperial_campaign: "#be123c", // rose-700
        civil_conflict: "#e11d48", // rose-600
        communal_violence: "#eab308", // yellow-500
        other: "#64748b", // slate-500
    };

    return colors[type] || "#64748b";
}

/**
 * Calculate century from a year.
 */
export function getCentury(year: number): number {
    return Math.floor(year / 100) * 100;
}

/**
 * Get century label (e.g., "11th century").
 */
export function getCenturyLabel(year: number): string {
    const century = Math.ceil(year / 100);
    const suffix =
        century === 11 || century === 12 || century === 13
            ? "th"
            : century % 10 === 1
                ? "st"
                : century % 10 === 2
                    ? "nd"
                    : century % 10 === 3
                        ? "rd"
                        : "th";

    return `${century}${suffix} century`;
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Class name utility (like clsx but simpler).
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(" ");
}
