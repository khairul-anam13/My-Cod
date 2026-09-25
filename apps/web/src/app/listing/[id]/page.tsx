import { BadgeCheck, ChevronRight, Clock, MapPin, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { MapWrapper } from "@/components/MapWrapper";
import { RatingStars } from "@/components/RatingStars";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import { formatRelativeTime, formatRupiah } from "@/lib/format";
import type { Category, Listing, ListingStatus, Profile } from "@my-cod/shared-types";
import { ListingActions } from "./ListingActions";
import { ListingGallery } from "./ListingGallery";

type ListingDetail = Listing & {
  seller: Pick<Profile, "id" | "name" | "profile_photo_url" | "city" | "is_verified" | "rating_avg">;
  category: Category;
};

const STATUS_STYLE: Record<Exclude<ListingStatus, "available">, string> = {
  reserved: "border-accent bg-accent-soft text-accent",
  sold: "border-border bg-surface-muted text-muted-foreground",
};
const STATUS_LABEL: Record<Exclude<ListingStatus, "available">, string> = {
  reserved: "Ditahan",
  sold: "Terjual",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await apiFetch<ListingDetail | null>(`/listings/${id}`).catch(() => null);
  if (!listing) notFound();

  const CategoryIcon = CATEGORY_ICONS[listing.category.icon ?? ""] ?? DEFAULT_CATEGORY_ICON;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 md:px-6 md:py-6">
      <div className="mb-4 hidden md:block">
        <BackButton />
      </div>

      <div className="md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-8">
        {/* Gallery — full-bleed on mobile, boxed on desktop. */}
        <div className="relative -mx-4 md:col-start-1 md:row-start-1 md:mx-0">
          <div className="absolute left-3 top-3 z-10 md:hidden">
            <BackButton variant="overlay" />
          </div>
          <ListingGallery photos={listing.photos} title={listing.title} />
        </div>

        {/* Buy box — sticky alongside the gallery on desktop. */}
        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          <div className="flex flex-col gap-4 pt-4 md:sticky md:top-32 md:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-none border-2 border-border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                <CategoryIcon size={13} />
                {listing.category.name}
              </Badge>
              {listing.status !== "available" && (
                <Badge
                  className={`rounded-none border-2 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${STATUS_STYLE[listing.status]}`}
                >
                  {STATUS_LABEL[listing.status]}
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-xl font-black leading-tight tracking-tight text-foreground md:text-2xl">
                {listing.title}
              </h1>
              <p className="mt-2 text-3xl font-black text-primary">{formatRupiah(listing.price)}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={13} />
                Diposting {formatRelativeTime(listing.created_at)}
              </p>
            </div>

            {/* Seller — the trust signal, kept next to the CTA (PRD 1.4). */}
            <Link
              href={`/profile/${listing.seller.id}`}
              className="flex items-center gap-3 border-2 border-border bg-surface p-3 transition-colors hover:bg-surface-muted"
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={listing.seller.profile_photo_url ?? undefined} alt={listing.seller.name} />
                <AvatarFallback>
                  <UserRound size={20} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-bold text-foreground">{listing.seller.name}</p>
                  {listing.seller.is_verified && (
                    <BadgeCheck size={15} className="shrink-0 fill-accent text-surface" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{listing.seller.city}</p>
                <RatingStars rating={listing.seller.rating_avg} />
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </Link>

            <ListingActions
              listingId={listing.id}
              sellerId={listing.seller.id}
              price={listing.price}
              status={listing.status}
            />

            <div className="flex items-start gap-2 border-2 border-border bg-surface-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
              <p>
                Transaksi COD di tempat umum yang ramai. Cek barang dulu sebelum bayar — jangan transfer
                di muka.
              </p>
            </div>

            <div className="flex justify-center">
              <ReportDialog
                target={{ reported_listing_id: listing.id }}
                triggerLabel="Laporkan barang ini"
                backHref={`/listing/${listing.id}`}
              />
            </div>
          </div>
        </div>

        {/* Description + area — under the gallery on desktop, after the buy box on mobile. */}
        <div className="flex flex-col gap-6 pt-6 md:col-start-1 md:row-start-2 md:pt-8">
          <section>
            <h2 className="mb-2 border-b-2 border-border pb-2 text-sm font-black uppercase tracking-wide text-foreground">
              Deskripsi
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {listing.description || "Penjual belum menulis deskripsi."}
            </p>
          </section>

          <section>
            <h2 className="mb-2 border-b-2 border-border pb-2 text-sm font-black uppercase tracking-wide text-foreground">
              Lokasi
            </h2>
            <div className="h-48 overflow-hidden border-2 border-border">
              <MapWrapper compact listings={[]} center={[listing.lat, listing.lng]} radiusKm={1} />
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              Area perkiraan di sekitar {listing.seller.city}. Demi keamanan, alamat persis tidak
              ditampilkan — titik temu diatur lewat chat.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
