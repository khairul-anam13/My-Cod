import { LocateFixed, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationState } from "@/hooks/useLocation";

/**
 * Shared location-source indicator for mobile + desktop Explore. The radar
 * ring (globals.css .signal-ring + animate-radar-ping) plays once when GPS
 * resolves — see DESIGN.md "signature element". It does not play for the
 * fallback/default-city case, since nothing was actually found there.
 */
export function LocationSignal({
  location,
  locating,
  className,
}: {
  location: LocationState;
  locating: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border-2 border-border bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase text-foreground",
        className,
      )}
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        {locating ? (
          <LocateFixed size={14} className="animate-pulse text-primary" />
        ) : (
          <>
            {location.source === "gps" && <span className="signal-ring animate-radar-ping" />}
            <MapPin size={14} className={location.source === "gps" ? "text-accent" : undefined} />
          </>
        )}
      </span>
      {locating ? "Mencari…" : location.source === "gps" ? "Lokasi aktif" : "Perkiraan"}
    </span>
  );
}
