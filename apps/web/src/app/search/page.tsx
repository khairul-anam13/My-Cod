"use client";

import { PackageOpen, SearchX, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ListingCard } from "@/components/ListingCard";
import { MapWrapper } from "@/components/MapWrapper";
import { SearchBox } from "@/components/layout/SearchBox";
import {
  DEFAULT_FILTERS,
  FilterControls,
  countActiveFilters,
  type SearchFilters,
} from "@/components/search/FilterControls";
import { MobileFilterFab } from "@/components/search/MobileFilterFab";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/hooks/useLocation";
import { apiFetch } from "@/lib/api";
import { fetchNearbyListings } from "@/lib/listings";
import type { Category, NearbyListing } from "@my-cod/shared-types";

const RESULT_LIMIT = 100;

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<NearbyListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URL is the single source of truth for filters, so results stay shareable
  // and the desktop category rail can deep-link straight into a filtered view.
  const keyword = searchParams.get("q") ?? "";
  const filters = useMemo<SearchFilters>(
    () => ({
      categoryId: searchParams.get("category") ?? "",
      radiusKm: Number(searchParams.get("radius")) || DEFAULT_FILTERS.radiusKm,
      minPrice: searchParams.get("min") ?? "",
      maxPrice: searchParams.get("max") ?? "",
    }),
    [searchParams],
  );

  function applyFilters(next: SearchFilters) {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (next.categoryId) params.set("category", next.categoryId);
    if (next.radiusKm !== DEFAULT_FILTERS.radiusKm) params.set("radius", String(next.radiusKm));
    if (next.minPrice) params.set("min", next.minPrice);
    if (next.maxPrice) params.set("max", next.maxPrice);
    router.replace(params.toString() ? `/search?${params}` : "/search", { scroll: false });
  }

  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.loading) return;

    let ignore = false;

    fetchNearbyListings({
      lat: location.lat,
      lng: location.lng,
      radius_km: filters.radiusKm,
      category_id: filters.categoryId || undefined,
      min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
      max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      limit: RESULT_LIMIT,
    })
      .then((data) => {
        if (ignore) return;
        setListings(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setListings([]);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      });

    return () => {
      ignore = true;
    };
  }, [
    location.lat,
    location.lng,
    location.loading,
    filters.radiusKm,
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
  ]);

  // Keyword narrowing runs client-side over the fetched page of results — the
  // nearby_listings RPC has no text parameter yet.
  const results = useMemo(() => {
    if (!listings) return null;
    const q = keyword.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.seller_name.toLowerCase().includes(q),
    );
  }, [listings, keyword]);

  const loading = results === null || location.loading;
  const activeCount = countActiveFilters(filters);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-3 md:px-6 md:pb-10 md:pt-6">
      {/* Mobile search bar — this route hides the global MobileHeader. */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <BackButton />
        <SearchBox defaultValue={keyword} />
      </div>

      <div className="md:flex md:gap-8">
        <aside className="hidden md:block md:w-64 md:shrink-0">
          <div className="sticky top-28 flex flex-col gap-5">
            <div className="h-44 overflow-hidden border-2 border-border">
              <MapWrapper
                compact
                listings={results ?? []}
                center={location.loading ? undefined : [location.lat, location.lng]}
                radiusKm={filters.radiusKm}
              />
            </div>

            <div className="flex items-center justify-between border-b-2 border-border pb-2">
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Filter</h2>
              {activeCount > 0 && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs font-bold text-primary"
                  onClick={() => applyFilters(DEFAULT_FILTERS)}
                >
                  Reset ({activeCount})
                </Button>
              )}
            </div>

            <FilterControls value={filters} onChange={applyFilters} categories={categories} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-black uppercase tracking-tight text-foreground md:text-2xl">
              {keyword ? `Hasil "${keyword}"` : "Cari Barang"}
            </h1>
            {!loading && (
              <span className="shrink-0 text-xs font-bold text-muted-foreground">
                {results?.length ?? 0} barang · {filters.radiusKm} km
              </span>
            )}
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="mb-6 flex flex-col items-center gap-3 rounded-none border-2 border-danger bg-danger-soft p-6 text-center uppercase"
            >
              <TriangleAlert size={28} />
              <AlertDescription className="text-sm font-bold text-danger">{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <ResultGrid>
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-3/4 rounded-none border-2 border-border" />
              ))}
            </ResultGrid>
          ) : results && results.length > 0 ? (
            <ResultGrid>
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ResultGrid>
          ) : (
            !error && (
              <NoResults
                keyword={keyword}
                hasFilters={activeCount > 0}
                onReset={() => applyFilters(DEFAULT_FILTERS)}
              />
            )
          )}
        </div>
      </div>

      <MobileFilterFab value={filters} onApply={applyFilters} categories={categories} />
    </div>
  );
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

function NoResults({
  keyword,
  hasFilters,
  onReset,
}: {
  keyword: string;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="border-2 border-border bg-surface-muted p-4">
        {keyword ? (
          <SearchX size={30} className="text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <PackageOpen size={30} className="text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>
      <h2 className="text-base font-black uppercase text-foreground">Tidak ada hasil</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {keyword
          ? `Nggak ada barang cocok dengan "${keyword}" di area ini. Coba kata lain atau perluas jarak.`
          : "Coba perluas jarak pencarian atau ubah filter harga."}
      </p>
      {hasFilters && (
        <Button variant="outline" className="mt-2 h-11 rounded-none border-2 px-5" onClick={onReset}>
          Reset filter
        </Button>
      )}
    </div>
  );
}
