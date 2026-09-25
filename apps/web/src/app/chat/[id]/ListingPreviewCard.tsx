import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { Listing } from "@my-cod/shared-types";

/** The item this conversation is about — pinned above the messages so context never scrolls away with the thread. */
export function ListingPreviewCard({
  listing,
}: {
  listing: Pick<Listing, "id" | "title" | "price" | "photos" | "status">;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-muted text-muted-foreground">
        {listing.photos[0] ? (
          <Image src={listing.photos[0]} alt={listing.title} fill className="object-cover" />
        ) : (
          <ImageOff size={16} strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black uppercase tracking-wide text-foreground">{listing.title}</p>
        <p className="text-sm font-bold text-primary">{formatRupiah(listing.price)}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="h-8 shrink-0 rounded-full px-3 text-xs">
        <Link href={`/listing/${listing.id}`}>Detail</Link>
      </Button>
    </div>
  );
}
