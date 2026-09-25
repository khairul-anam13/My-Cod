"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Scroll-snap carousel: a real swipe on mobile, arrows + thumbnail strip on
 * desktop. The scroller stays the source of truth for the active index, so
 * swipe / arrow / thumbnail all stay in sync.
 */
export function ListingGallery({ photos, title }: { photos: string[]; title: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== active) setActive(next);
  }

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, photos.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 border-2 border-border bg-surface-muted text-muted-foreground md:aspect-4/3">
        <ImageOff size={30} strokeWidth={1.5} />
        <span className="text-xs font-bold uppercase tracking-wide">Tanpa foto</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth no-scrollbar md:border-2 md:border-border"
        >
          {photos.map((photo, i) => (
            <div
              key={i}
              className="relative aspect-square w-full shrink-0 snap-center bg-surface-muted md:aspect-4/3"
            >
              <Image
                src={photo}
                alt={`${title} — foto ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            {/* Counter — the affordance that there is more to swipe.
                Overlays need an explicit z-index: the fill images inside the
                scroller are absolutely positioned and would otherwise paint
                over the arrows and swallow their clicks. */}
            <span className="pointer-events-none absolute right-3 top-3 z-10 border-2 border-border bg-background/85 px-2 py-1 text-[11px] font-black tabular-nums text-foreground backdrop-blur-sm">
              {active + 1} / {photos.length}
            </span>

            <Button
              type="button"
              aria-label="Foto sebelumnya"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              size="icon-lg"
              className="absolute left-3 inset-y-0 z-10 my-auto hidden rounded-none border-2 border-border bg-background/85 text-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 disabled:opacity-0 md:flex"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              type="button"
              aria-label="Foto berikutnya"
              onClick={() => goTo(active + 1)}
              disabled={active === photos.length - 1}
              size="icon-lg"
              className="absolute right-3 inset-y-0 z-10 my-auto hidden rounded-none border-2 border-border bg-background/85 text-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 disabled:opacity-0 md:flex"
            >
              <ChevronRight size={20} />
            </Button>

            {/* Dots — mobile only; desktop gets the thumbnail strip instead. */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:hidden">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 border border-border transition-all",
                    i === active ? "w-5 bg-primary" : "w-1.5 bg-background/70",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="hidden gap-2 md:flex">
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden border-2 transition-all",
                i === active ? "border-primary" : "border-border opacity-60 hover:opacity-100",
              )}
            >
              <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
