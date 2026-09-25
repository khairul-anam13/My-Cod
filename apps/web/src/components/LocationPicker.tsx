"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so it must never run during SSR.
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-muted text-muted-foreground">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-bold uppercase tracking-widest">Memuat Peta…</p>
    </div>
  ),
});

export function LocationPicker(props: {
  value: { lat: number; lng: number } | null;
  defaultCenter: [number, number];
  onPick: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  return <LocationPickerMap {...props} />;
}
