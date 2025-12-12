/**
 * Type definitions for the Red SubContinent application.
 */

// Conflict types matching API
export type ConflictType =
    | "war"
    | "invasion"
    | "massacre"
    | "riot"
    | "famine"
    | "partition_event"
    | "uprising"
    | "imperial_campaign"
    | "civil_conflict"
    | "communal_violence"
    | "other";

export type ConflictScale = "local" | "regional" | "subcontinental" | "international";

export type ActorRole =
    | "aggressor"
    | "defender"
    | "colonial_power"
    | "rebel_group"
    | "empire"
    | "kingdom"
    | "state"
    | "other";

export type SourceType =
    | "wikipedia"
    | "book"
    | "academic_paper"
    | "database"
    | "government_record"
    | "other";

// Location
export interface Location {
    id: string;
    name: string | null;
    location_type: string | null;
    latitude: number | null;
    longitude: number | null;
    is_primary: boolean;
}

// Actor
export interface Actor {
    id: string;
    name: string;
    role: ActorRole;
    casualties: number | null;
    notes: string | null;
}

// Source
export interface Source {
    id: string;
    source_type: SourceType;
    title: string | null;
    url: string | null;
    citation_text: string | null;
    accessed_date: string | null;
}

// Conflict list item (summary view)
export interface ConflictListItem {
    id: string;
    slug: string;
    title: string;
    conflict_type: ConflictType;
    conflict_scale: ConflictScale;
    start_date: string | null;
    end_date: string | null;
    casualties_best: number | null;
    primary_region: string | null;
    primary_location: Location | null;
}

// Full conflict detail
export interface ConflictDetail extends ConflictListItem {
    description?: string | null;
    description_short: string | null;
    description_long: string | null;
    date_precision: string;
    casualties_low: number | null;
    casualties_high: number | null;
    casualties_includes_injuries: boolean;
    notes: string | null;
    uncertainty_notes: string | null;
    content_warning: string | null;
    locations: Location[];
    actors: Actor[];
    sources: Source[];
    created_at: string;
    updated_at: string;
}

// Paginated response
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Stats
export interface StatsSummary {
    total_conflicts: number;
    total_casualties_low: number;
    total_casualties_high: number;
    total_casualties_best: number;
    earliest_year: number | null;
    latest_year: number | null;
    by_type: Record<string, number>;
    by_century: Record<string, number>;
}

// Timeline
export interface TimelinePoint {
    year: number;
    count: number;
    casualties: number;
    conflicts: ConflictListItem[];
}

// GeoJSON types
export interface GeoJSONFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
    properties: {
        id: string;
        slug: string;
        title: string;
        conflict_type: ConflictType | null;
        start_date: string | null;
        end_date: string | null;
        casualties: number | null;
        location_name: string | null;
    };
}

export interface GeoJSONCollection {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
}

// Filter options
export interface ConflictFilters {
    year_start?: number;
    year_end?: number;
    conflict_type?: ConflictType[];
    min_casualties?: number;
    max_casualties?: number;
    region?: string;
    search?: string;
}

// Story mode chapter
export interface StoryChapter {
    id: string;
    title: string;
    subtitle: string;
    year_start: number;
    year_end: number;
    description: string;
    map_center: [number, number]; // [lat, lng]
    map_zoom: number;
    highlight_conflicts?: string[]; // Conflict slugs to highlight
}
