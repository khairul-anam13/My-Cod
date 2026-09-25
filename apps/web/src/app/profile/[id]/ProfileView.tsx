"use client";

import { ImageOff, PackageOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { formatRupiah } from "@/lib/format";
import { useSession } from "@/hooks/useSession";
import type { Listing, Profile, Review } from "@my-cod/shared-types";
import { ChatFollowBar } from "./ChatFollowBar";
import { ProfileActions } from "./ProfileActions";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileTrustHero } from "./ProfileTrustHero";
import { RecentFeedback } from "./RecentFeedback";
import { TrustBadges } from "./TrustBadges";

interface ReviewWithReviewer extends Review {
  reviewer: { id: string; name: string; profile_photo_url: string | null };
}

export function ProfileView({
  profile,
  listings,
  reviews,
}: {
  profile: Profile;
  listings: Listing[];
  reviews: ReviewWithReviewer[];
}) {
  const { user, loading } = useSession();
  const isOwn = !loading && user?.id === profile.id;

  const soldCount = listings.filter((l) => l.status === "sold").length;
  const availableListing = listings.find((l) => l.status !== "sold") ?? listings[0];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="flex flex-col gap-6 pb-6">
      {isOwn ? (
        <div className="px-2 pt-2">
          <BackButton />
        </div>
      ) : (
        <ProfileHeader title={profile.name} shareUrl={shareUrl} />
      )}

      <div className="mx-auto w-full max-w-3xl px-4 md:max-w-5xl md:px-6">
        <div className="md:grid md:grid-cols-[320px_1fr] md:items-start md:gap-8">
          <div className="flex flex-col gap-6">
            <ProfileTrustHero
              name={profile.name}
              photoUrl={profile.profile_photo_url}
              isVerified={profile.identity_verified}
              memberSinceYear={new Date(profile.created_at).getFullYear()}
              soldCount={soldCount}
              reviewCount={reviews.length}
              ratingAvg={profile.rating_avg}
            />

            <TrustBadges
              isVerified={profile.identity_verified}
              ratingAvg={profile.rating_avg}
              reviewCount={reviews.length}
              listingCount={listings.length}
            />

            {isOwn && <ProfileActions profileId={profile.id} />}
            {!isOwn && <ChatFollowBar firstListingId={availableListing?.id ?? null} />}
          </div>

          <div className="mt-6 flex flex-col gap-6 md:mt-0">
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-foreground">
                Barang Dijual ({listings.length})
              </h2>
              {listings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <PackageOpen size={26} className="text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">Belum ada barang aktif.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="flex flex-col overflow-hidden rounded-2xl border border-border">
                      <Link href={`/listing/${listing.id}`} className="flex flex-col">
                        <div className="relative aspect-square w-full flex items-center justify-center bg-surface-muted text-muted-foreground">
                          {listing.photos[0] ? (
                            <Image src={listing.photos[0]} alt={listing.title} fill className="object-cover" />
                          ) : (
                            <ImageOff size={20} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-sm font-medium text-foreground">{listing.title}</p>
                          <p className="text-sm font-semibold text-primary">{formatRupiah(listing.price)}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <RecentFeedback reviews={reviews} />
          </div>
        </div>
      </div>

      {/* Clears the fixed mobile ChatFollowBar so it doesn't cover the last content. */}
      {!isOwn && <div className="md:hidden h-16" aria-hidden />}
    </div>
  );
}
