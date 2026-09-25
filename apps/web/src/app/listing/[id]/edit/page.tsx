"use client";

import { Loader2 } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ListingForm } from "@/components/ListingForm";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import type { Listing } from "@my-cod/shared-types";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(`/listing/${id}/edit`)}`);
    }
  }, [sessionLoading, session, router, id]);

  useEffect(() => {
    if (!session) return;
    apiFetch<Listing>(`/listings/${id}`)
      .then((data) => {
        if (data.seller_id !== session.user.id) {
          router.replace(`/listing/${id}`);
          return;
        }
        setListing(data);
      })
      .catch(() => setListing(null));
  }, [session, id, router]);

  if (sessionLoading || !session || listing === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return <p className="p-4 text-center text-sm text-muted-foreground">Barang tidak ditemukan.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <BackButton />
        <div>
          <h1 className="text-base font-semibold text-foreground">Edit Barang</h1>
          <p className="text-xs text-muted-foreground">Perbarui detail listing kamu</p>
        </div>
      </div>

      <ListingForm mode="edit" token={session.access_token} userId={session.user.id} listing={listing} />
    </div>
  );
}
