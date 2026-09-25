"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  FilterControls,
  countActiveFilters,
  DEFAULT_FILTERS,
  type SearchFilters,
} from "@/components/search/FilterControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Category } from "@my-cod/shared-types";

/**
 * Mobile-only floating filter button, parked just above the bottom nav bar.
 * Opens the same FilterControls as the desktop sidebar, but as a bottom sheet
 * with explicit Apply/Reset — mobile users edit a draft, then commit.
 */
export function MobileFilterFab({
  value,
  onApply,
  categories,
}: {
  value: SearchFilters;
  onApply: (next: SearchFilters) => void;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const activeCount = countActiveFilters(value);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <Button
        variant="brutalist"
        onClick={() => setOpen(true)}
        aria-label="Buka filter"
        className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] right-4 z-40 h-14 gap-2 px-4 text-sm"
      >
        <SlidersHorizontal size={18} strokeWidth={3} />
        Filter
        {activeCount > 0 && (
          <Badge className="ml-0.5 h-5 min-w-5 rounded-full border-2 border-primary-foreground bg-background px-1 text-[10px] font-black text-primary">
            {activeCount}
          </Badge>
        )}
      </Button>

      <SheetContent
        side="bottom"
        className="max-h-[85vh] gap-0 rounded-t-2xl border-t-2 border-border p-0"
      >
        <SheetHeader className="border-b-2 border-border px-4 py-3">
          <SheetTitle className="text-base font-black uppercase tracking-wide">Filter Pencarian</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FilterControls value={draft} onChange={setDraft} categories={categories} />
        </div>

        <SheetFooter className="flex-row gap-2 border-t-2 border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-none border-2"
            onClick={() => setDraft(DEFAULT_FILTERS)}
          >
            Reset
          </Button>
          <SheetClose asChild>
            <Button
              type="button"
              variant="brutalist"
              className="h-11 flex-1"
              onClick={() => onApply(draft)}
            >
              Terapkan
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
