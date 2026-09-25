"use client";

import { LocateFixed } from "lucide-react";
import { useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";

// Fix leaflet's default marker icon lookup in a bundler environment.
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ClickHandler({
  onPick,
  disabled,
}: {
  onPick: (lat: number, lng: number, accuracy?: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Hands the live Leaflet map instance to the parent so "Lokasi Saya" can fly the view without fighting the controlled marker state. */
function MapRefBridge({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  mapRef.current = map;
  return null;
}

export default function LocationPickerMap({
  value,
  defaultCenter,
  onPick,
  disabled = false,
}: {
  value: { lat: number; lng: number } | null;
  defaultCenter: [number, number];
  onPick: (lat: number, lng: number, accuracy?: number) => void;
  disabled?: boolean;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (disabled || typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        onPick(latitude, longitude, accuracy);
        mapRef.current?.flyTo([latitude, longitude], 16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={value ? [value.lat, value.lng] : defaultCenter}
        zoom={value ? 16 : 13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapRefBridge mapRef={mapRef} />
        <ClickHandler onPick={onPick} disabled={disabled} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>

      <Button
        type="button"
        onClick={useMyLocation}
        disabled={disabled || locating}
        variant="brutalist"
        size="sm"
        className="absolute right-2 top-2 z-1000 h-9 gap-1.5 px-3 text-xs"
      >
        <LocateFixed size={14} className={locating ? "animate-pulse" : undefined} />
        {locating ? "Mencari…" : "Lokasi Saya"}
      </Button>
    </div>
  );
}
