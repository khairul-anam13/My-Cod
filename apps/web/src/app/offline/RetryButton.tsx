"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Full reload rather than a client-side nav — we want a real network retry. */
export function RetryButton() {
  return (
    <Button variant="brutalist" className="mt-2 h-11 px-6" onClick={() => window.location.reload()}>
      <RotateCw size={16} strokeWidth={3} />
      Coba Lagi
    </Button>
  );
}
