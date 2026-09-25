"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Returns false during SSR and the first client render, then true after
// hydration — avoids the SSR/CSR markup mismatch that client-only state
// (geolocation, localStorage, etc.) would otherwise cause.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
