"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SportSpot } from "@/lib/types";
import { SPORT_EMOJIS, SPORT_COLORS, SPORT_LABELS } from "@/lib/types";

interface MapComponentProps {
  compact?: boolean;
  spots?: SportSpot[];       // Si fournis, pas de fetch interne
  onAddSpot?: () => void;    // Callback bouton +
}

export default function MapComponent({ compact = false, spots: propSpots, onAddSpot }: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [spots, setSpots] = useState<SportSpot[]>(propSpots || []);
  const markersRef = useRef<any[]>([]);

  // Fetch spots if not provided (dashboard compact mode)
  useEffect(() => {
    if (propSpots) { setSpots(propSpots); return; }
    supabase.from("sport_spots").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setSpots(data || []);
    });
  }, [propSpots]);

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [48.866, 2.37],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
    };

    initMap();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Update markers when spots change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const L = require("leaflet");

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    spots.forEach((spot) => {
      const color = SPORT_COLORS[spot.type] || "#5B9CF6";
      const emoji = SPORT_EMOJIS[spot.type] || "📍";

      const icon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;
          background:${color};border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);border:2px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);font-size:14px;display:block;text-align:center;line-height:32px;">${emoji}</span></div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -40],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapRef.current);
      marker.bindPopup(`
        <div style="font-family:-apple-system,sans-serif;min-width:160px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:18px;">${emoji}</span>
            <p style="font-size:14px;font-weight:600;color:#1D1D1F;margin:0;">${spot.name}</p>
          </div>
          <p style="font-size:12px;color:#6B7280;margin:0;">${SPORT_LABELS[spot.type]}${spot.distance_km ? ` · ${spot.distance_km} km` : ""}</p>
          ${spot.notes ? `<p style="font-size:11px;color:#9CA3AF;margin-top:4px;">${spot.notes}</p>` : ""}
        </div>
      `);
      markersRef.current.push(marker);
    });
  }, [spots, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: compact ? 200 : 400 }} />

      {/* Legend overlay — full mode only */}
      {!compact && mapLoaded && spots.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="absolute bottom-4 left-4 glass-sm rounded-xl p-3">
          <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Légende</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(SPORT_EMOJIS).map(([type, emoji]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: SPORT_COLORS[type] }} />
                <span className="text-[11px]">{emoji}</span>
                <span className="text-[11px] text-gray-600">{SPORT_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add spot button */}
      {!compact && onAddSpot && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onAddSpot}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-white text-[13px] font-medium shadow-lg"
          style={{ background: "linear-gradient(135deg, #34D399, #10B981)", boxShadow: "0 4px 16px rgba(52,211,153,0.4)" }}>
          <Plus className="w-4 h-4" /> Nouveau spot
        </motion.button>
      )}

      {/* Empty state overlay */}
      {mapLoaded && spots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass-sm rounded-2xl p-5 text-center pointer-events-auto">
            <p className="text-2xl mb-2">📍</p>
            <p className="text-[13px] font-semibold text-gray-700">Aucun spot enregistré</p>
            <p className="text-[11px] text-gray-400 mt-1">Ajoutez vos lieux d'entraînement</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-100/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-gray-500">Chargement de la carte…</p>
          </div>
        </div>
      )}
    </div>
  );
}
