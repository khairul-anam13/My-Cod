"use client";

import { BadgeCheck, Heart, ImageOff, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatDistance, formatRupiah } from "@/lib/format";
import type { NearbyListing } from "@my-cod/shared-types";

/** Save/favorite is UI-only — there's no `favorites` table or endpoint yet, so it won't persist across reloads. */
export function RecommendedCard({ listing }: { listing: NearbyListing }) {
  const [saved, setSaved] = useState(false);
  const photo = listing.photos[0];

  return (
    <div className="w-40 shrink-0">
      <div className="relative aspect-square w-full overflow-hidden border-2 border-border bg-surface-muted">
        <Link href={`/listing/${listing.id}`} className="absolute inset-0">
          {photo ? (
            <Image src={photo} alt={listing.title} fill sizes="160px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/60">
              <ImageOff size={22} strokeWidth={1.5} />
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "Batal simpan" : "Simpan barang"}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center border-2 border-border bg-surface/90 text-foreground"
        >
          <Heart size={14} className={saved ? "fill-primary text-primary" : undefined} />
        </button>
      </div>

      <Link href={`/listing/${listing.id}`} className="mt-1.5 block">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{listing.title}</p>
        <p className="text-sm font-black text-primary">{formatRupiah(listing.price)}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={11} />
          {formatDistance(listing.distance_m)}
        </div>
        {listing.seller_is_verified && (
          <span className="mt-1 inline-flex items-center gap-1 border border-accent bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-foreground">
            <BadgeCheck size={10} className="text-accent" />
            Terpercaya
          </span>
        )}
      </Link>
    </div>
  );
}
