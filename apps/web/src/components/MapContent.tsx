"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatRupiah } from "@/lib/format";
import type { NearbyListing } from "@my-cod/shared-types";
import Link from "next/link";

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icon function
const createCustomIcon = (price: number) => {
  return L.divIcon({
    className: "custom-map-marker bg-transparent border-none shadow-none",
    html: `<div style="background-color: var(--primary); color: var(--primary-foreground); padding: 4px 8px; border: 2px solid var(--border-color); font-weight: 900; box-shadow: 2px 2px 0px var(--border-color); display: inline-block; white-space: nowrap;">${formatRupiah(price).replace(/,00$/, "")}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
};

// Price pills overlap badly in a narrow sidebar map — use dots there instead.
const compactIcon = L.divIcon({
  className: "custom-map-marker bg-transparent border-none shadow-none",
  html: `<div style="width: 10px; height: 10px; background: var(--primary); border: 2px solid var(--border-color); border-radius: 50%;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapContent({ listings, center, radiusKm, compact = false }: { listings: NearbyListing[]; center?: [number, number]; radiusKm: number; compact?: boolean }) {
  const defaultCenter: [number, number] = center || [-6.200000, 106.816666]; // Jakarta fallback
  
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Cleaner, more brutalist-friendly map style
        />
        
        {center && (
          <>
            <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "var(--primary)", fillColor: "var(--primary)", fillOpacity: 0.1, weight: 2 }} />
            <Marker position={center} icon={L.divIcon({
              className: "custom-user-marker bg-transparent border-none shadow-none",
              html: `<div style="width: 16px; height: 16px; background: var(--accent); border: 2px solid var(--border-color); border-radius: 50%; box-shadow: 2px 2px 0px var(--border-color);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}>
              <Popup>Lokasi Kamu</Popup>
            </Marker>
          </>
        )}

        <MapUpdater center={defaultCenter} />

        {listings.map(listing => (
          <Marker
            key={listing.id}
            position={[listing.lat, listing.lng]}
            icon={compact ? compactIcon : createCustomIcon(listing.price)}
          >
            <Popup className="brutalist-popup">
              <div className="font-sans">
                <p className="font-bold mb-1 leading-tight text-foreground">{listing.title}</p>
                <p className="text-primary font-black mb-3 text-sm">{formatRupiah(listing.price)}</p>
                <Link href={`/listing/${listing.id}`} className="block text-center bg-primary text-primary-foreground font-black text-xs py-2 border-2 border-border uppercase brutalist-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">Lihat Barang</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Global styles for leaflet overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
          background-color: var(--surface-muted) !important;
          font-family: var(--font-sans) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0 !important;
          border: 2px solid var(--border-color) !important;
          box-shadow: 4px 4px 0px var(--primary) !important;
          background: var(--surface) !important;
          color: var(--foreground) !important;
        }
        .leaflet-popup-tip {
          border: 2px solid var(--border-color) !important;
          border-top: none !important;
          border-left: none !important;
          background: var(--surface) !important;
        }
        .leaflet-popup-content {
          margin: 12px !important;
        }
      `}} />
    </div>
  );
}
