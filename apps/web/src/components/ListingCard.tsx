import { BadgeCheck, ImageOff, MapPin, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatRupiah } from "@/lib/format";
import type { NearbyListing } from "@my-cod/shared-types";

export function ListingCard({ listing }: { listing: NearbyListing }) {
  const photo = listing.photos[0];

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-none brutalist-card bg-surface"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-border">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-muted text-muted-foreground/60">
            <ImageOff size={28} strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Tanpa foto</span>
          </div>
        )}

        <Badge className="absolute left-2 bottom-2 gap-1 rounded-none border-2 border-border bg-primary px-2.5 py-1 text-[10px] font-black tracking-wide text-primary-foreground uppercase shadow-[4px_4px_0px_var(--primary)]">
          <MapPin size={12} strokeWidth={3} />
          {formatDistance(listing.distance_m)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 md:p-4">
        <p className="line-clamp-2 text-sm font-bold text-foreground leading-snug">{listing.title}</p>
        <p className="text-lg font-black text-primary">{formatRupiah(listing.price)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <div className="flex flex-1 items-center gap-1 min-w-0">
            <span className="truncate font-bold uppercase">{listing.seller_name}</span>
            {listing.seller_is_verified && (
              <BadgeCheck size={14} className="shrink-0 fill-accent text-surface" />
            )}
          </div>
          <Badge
            variant="outline"
            className="hidden shrink-0 gap-1 rounded-none border-border bg-surface-muted px-1.5 py-0.5 font-bold text-foreground md:inline-flex"
          >
            <ShieldCheck size={10} className="text-accent" />
            COD Aman
          </Badge>
          <Badge variant="outline" className="shrink-0 gap-0.5 rounded-none border-border bg-surface-muted px-1.5 py-0.5 font-bold text-foreground">
            <Star size={10} className="fill-accent text-accent" />
            {listing.seller_rating_avg.toFixed(1)}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
