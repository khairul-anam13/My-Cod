"use client";

import { LocateFixed, MapPin, PackageOpen, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryHighlights } from "@/components/home/CategoryHighlights";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { RecommendedCard } from "@/components/home/RecommendedCard";
import { ListingCard } from "@/components/ListingCard";
import { PrimaryHeader } from "@/components/layout/PrimaryHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/useHydrated";
import { useLocation } from "@/hooks/useLocation";
import { diversifyFeed, fetchNearbyListings } from "@/lib/listings";
import type { NearbyListing } from "@my-cod/shared-types";

// Explore is the "quick browse" surface (PRD 4.1): one cheap request, no
// category/price filtering. Targeted searching lives on /search instead.
const FEED_RADIUS_KM = 25;
const FEED_LIMIT = 24;

export default function ExplorePage() {
  const location = useLocation();
  const mounted = useHydrated();
  const [listings, setListings] = useState<NearbyListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.loading) return;

    let ignore = false;

    fetchNearbyListings({
      lat: location.lat,
      lng: location.lng,
      radius_km: FEED_RADIUS_KM,
      limit: FEED_LIMIT,
    })
      .then((data) => {
        if (ignore) return;
        setListings(diversifyFeed(data));
        setError(null);
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setListings([]);
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      });

    return () => {
      ignore = true;
    };
  }, [location.lat, location.lng, location.loading]);

  const locating = !mounted || location.loading;

  return (
    <>
      {/* Mobile — native-app-style Beranda main content */}
      <div className="md:hidden">
        <PrimaryHeader title="Jelajah Lokal" />
        <HomeSearchBar />
        <CategoryHighlights />

        <div className="mt-6 flex items-center justify-between px-4">
          <h2 className="text-base font-black text-foreground">Rekomendasi Untukmu</h2>
          <Link href="/search" className="text-xs font-bold uppercase tracking-wide text-primary">
            Lihat Semua
          </Link>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mx-4 mt-3 flex flex-col items-center gap-2 rounded-2xl border border-danger bg-danger-soft p-4 text-center"
          >
            <TriangleAlert size={22} />
            <AlertDescription className="text-xs font-semibold text-danger">{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-6">
          {listings === null || locating ? (
            Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-4/5 w-40 shrink-0 rounded-2xl" />
            ))
          ) : listings.length === 0 && !error ? (
            <div className="w-full">
              <EmptyState />
            </div>
          ) : (
            listings.map((listing) => <RecommendedCard key={listing.id} listing={listing} />)
          )}
        </div>
      </div>

      {/* Desktop — unchanged e-commerce-style layout */}
      <div className="hidden md:block mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Rekomendasi Untukmu
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Barang dari warga di sekitarmu — geser terus buat lihat-lihat.
            </p>
          </div>

          <Badge className="flex shrink-0 gap-1.5 rounded-none border-2 border-border bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground">
            {locating ? (
              <LocateFixed size={14} className="animate-pulse text-primary" />
            ) : (
              <MapPin size={14} className={location.source === "gps" ? "text-accent" : undefined} />
            )}
            <span className="uppercase">
              {locating ? "Mencari…" : location.source === "gps" ? "Lokasi aktif" : "Perkiraan"}
            </span>
          </Badge>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mx-auto mb-6 flex max-w-lg flex-col items-center gap-3 rounded-none border-2 border-danger bg-danger-soft p-6 text-center uppercase brutalist-shadow"
          >
            <TriangleAlert size={28} />
            <AlertDescription className="text-sm font-bold text-danger">{error}</AlertDescription>
          </Alert>
        )}

        {listings === null || locating ? (
          <DesktopFeedGrid>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-3/4 rounded-none border-2 border-border" />
            ))}
          </DesktopFeedGrid>
        ) : listings.length === 0 && !error ? (
          <EmptyState />
        ) : (
          <DesktopFeedGrid>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </DesktopFeedGrid>
        )}

        {listings !== null && listings.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 border-t-2 border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">Nggak nemu yang dicari?</p>
            <Button asChild variant="brutalist" className="h-11 px-5">
              <Link href="/search">
                <Search size={16} strokeWidth={3} />
                Cari dengan filter
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function DesktopFeedGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">{children}</div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="border-2 border-border bg-surface-muted p-4">
        <PackageOpen size={32} className="text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-black uppercase text-foreground">Belum ada barang</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Belum ada yang jualan di sekitarmu. Jadi yang pertama, atau coba cari dengan radius lebih luas.
      </p>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="brutalist" className="h-11 px-5">
          <Link href="/post">Jual Barang</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-none border-2 px-5">
          <Link href="/search">Cari Manual</Link>
        </Button>
      </div>
    </div>
  );
}
