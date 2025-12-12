"use client";

import { useMemo, useState, useCallback } from "react";
import Map, { NavigationControl, Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getConflictTypeColor, formatNumber } from "@/lib/utils";
import type { ConflictType, GeoJSONCollection } from "@/types";

interface MapExplorerProps {
    geoJsonData: GeoJSONCollection | undefined;
    onSelectConflict: (id: string) => void;
    onLoad?: () => void;
}

export default function MapExplorer({ geoJsonData, onSelectConflict, onLoad }: MapExplorerProps) {
    const [popupInfo, setPopupInfo] = useState<any>(null);

    const seededOffset = useCallback((key: string) => {
        // deterministic pseudo-random offset so markers don't jump between renders
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash << 5) - hash + key.charCodeAt(i);
            hash |= 0;
        }
        const normalize = (hash % 1000) / 1000;
        return (normalize - 0.5) * 2; // -1 to 1
    }, []);

    const markers = useMemo(() => {
        if (!geoJsonData?.features) return null;

        return geoJsonData.features.map((feature, index) => {
            const { geometry, properties } = feature;
            if (!geometry || !geometry.coordinates) return null;

            const [lng, lat] = geometry.coordinates;
            const { id, title, conflict_type, casualties } = properties || {};

            if (lng === undefined || lat === undefined || Number.isNaN(lng) || Number.isNaN(lat)) {
                return null;
            }

            const color = getConflictTypeColor(conflict_type as ConflictType || "other");
            let size = 10;
            if (casualties && casualties > 10000) size = 14;
            if (casualties && casualties > 100000) size = 20;

            const jitterLng = lng + seededOffset(String(id || index)) * 0.3;
            const jitterLat = lat + seededOffset(String(title || index + "lat")) * 0.3;

            return (
                <Marker
                    key={`marker-${index}`}
                    longitude={jitterLng}
                    latitude={jitterLat}
                    anchor="center"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        if (id) onSelectConflict(id);
                        setPopupInfo(feature);
                    }}
                >
                    <div
                        className="rounded-full border-2 border-white/40 shadow-lg hover:scale-150 transition-transform duration-200 cursor-pointer"
                        style={{
                            backgroundColor: color,
                            width: `${size}px`,
                            height: `${size}px`,
                            boxShadow: `0 0 ${size}px ${color}40`,
                        }}
                        onMouseEnter={() => setPopupInfo(feature)}
                        onMouseLeave={() => setPopupInfo(null)}
                    />
                </Marker>
            );
        });
    }, [geoJsonData, onSelectConflict, seededOffset]);

    return (
        <Map
            initialViewState={{
                longitude: 78,
                latitude: 22,
                zoom: 4.5,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={{
                version: 8,
                sources: {
                    "carto-dark": {
                        type: "raster",
                        tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
                        tileSize: 256,
                        attribution: "(c) OpenStreetMap contributors, (c) CARTO",
                    },
                },
                layers: [
                    {
                        id: "carto-dark-layer",
                        type: "raster",
                        source: "carto-dark",
                        minzoom: 0,
                        maxzoom: 22,
                    },
                ],
            }}
            minZoom={3}
            maxZoom={10}
            onLoad={onLoad}
        >
            <NavigationControl position="top-right" showCompass={false} />

            {markers}

            {popupInfo && (
                <Popup
                    anchor="top"
                    longitude={popupInfo.geometry.coordinates[0]}
                    latitude={popupInfo.geometry.coordinates[1]}
                    closeButton={false}
                    closeOnClick={false}
                    offset={12}
                    maxWidth="300px"
                    className="dark-popup"
                >
                    <div className="bg-[#1a1a1c] p-3 rounded min-w-[180px] font-sans">
                        <p className="font-medium text-white mb-1 text-[13px]">{popupInfo.properties?.title || "Unknown"}</p>
                        <p className="text-[11px] text-white/50 m-0">{popupInfo.properties?.start_date || ""}</p>
                        {popupInfo.properties?.casualties && (
                            <p className="text-[12px] text-[#8b0000] mt-1.5 m-0">
                                {formatNumber(popupInfo.properties.casualties)} casualties
                            </p>
                        )}
                    </div>
                </Popup>
            )}
        </Map>
    );
}
