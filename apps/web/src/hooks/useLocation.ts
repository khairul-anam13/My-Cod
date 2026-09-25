"use client";

import { useEffect, useState } from "react";

const DEFAULT_LOCATION = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_CITY_LAT ?? "-6.2"),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_CITY_LNG ?? "106.816666"),
};

export type LocationSource = "gps" | "fallback";

export interface LocationState {
  lat: number;
  lng: number;
  source: LocationSource;
  loading: boolean;
}

function hasGeolocation() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

// PRD 4.1: home screen must show nearby items immediately; if location access
// is denied, fall back to the city's default center rather than blocking.
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>(() => ({
    ...DEFAULT_LOCATION,
    source: "fallback",
    loading: hasGeolocation(),
  }));

  useEffect(() => {
    if (!hasGeolocation()) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
          loading: false,
        });
      },
      () => {
        setState((s) => ({ ...s, loading: false }));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return state;
}
