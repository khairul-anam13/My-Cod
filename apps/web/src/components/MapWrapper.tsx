"use client";

import dynamic from "next/dynamic";
import type { NearbyListing } from "@my-cod/shared-types";

// Leaflet needs to be dynamically imported with ssr: false
const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-muted text-muted-foreground border-r-2 border-border p-8">
      <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-sm">Memuat Peta...</p>
    </div>
  ),
});

export function MapWrapper(props: {
  listings: NearbyListing[];
  center?: [number, number];
  radiusKm: number;
  /** Small dot markers instead of price pills — for narrow sidebar maps. */
  compact?: boolean;
}) {
  return <MapContent {...props} />;
}
