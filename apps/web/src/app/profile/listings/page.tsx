"use client";

import { ImageOff, Loader2, MoreVertical, Package, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { Listing, ListingStatus } from "@my-cod/shared-types";

const STATUS_LABEL: Record<ListingStatus, string> = {
  available: "Tersedia",
  reserved: "Ditahan",
  sold: "Terjual",
};

const STATUS_BADGE_STYLE: Record<ListingStatus, string> = {
  available: "bg-primary-soft text-primary-soft-foreground",
  reserved: "bg-accent-soft text-accent",
  sold: "bg-surface-muted text-muted-foreground",
};

export default function MyListingsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent("/profile/listings")}`);
      return;
    }
    apiFetch<Listing[]>(`/listings?seller_id=${session.user.id}`)
      .then(setListings)
      .catch(() => setListings([]));
  }, [sessionLoading, session, router]);

  async function updateStatus(listing: Listing, status: ListingStatus) {
    if (!session) return;
    try {
      const updated = await apiFetch<Listing>(`/listings/${listing.id}/status`, {
        method: "PATCH",
        token: session.access_token,
        body: { status },
      });
      setListings((prev) => prev?.map((l) => (l.id === listing.id ? updated : l)) ?? null);
      toast.success(`Ditandai ${STATUS_LABEL[status].toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  }

  async function confirmDelete() {
    if (!session || !deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/listings/${deleteTarget.id}`, { method: "DELETE", token: session.access_token });
      setListings((prev) => prev?.filter((l) => l.id !== deleteTarget.id) ?? null);
      toast.success("Barang dihapus.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus barang.");
    } finally {
      setDeleting(false);
    }
  }

  if (sessionLoading || !session) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <BackButton />
        <div>
          <h1 className="text-base font-semibold text-foreground">Listing Saya</h1>
          <p className="text-xs text-muted-foreground">Kelola barang yang kamu jual</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {listings === null &&
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}

        {listings?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Package size={28} className="text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Belum ada barang yang kamu jual.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/post">Jual Barang</Link>
            </Button>
          </div>
        )}

        {listings?.map((listing) => (
          <div key={listing.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <Link
              href={`/listing/${listing.id}`}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted"
            >
              {listing.photos[0] ? (
                <Image src={listing.photos[0]} alt={listing.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff size={18} strokeWidth={1.5} />
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/listing/${listing.id}`} className="line-clamp-1 text-sm font-medium text-foreground">
                {listing.title}
              </Link>
              <p className="text-sm font-semibold text-primary">{formatRupiah(listing.price)}</p>
              <Badge
                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_STYLE[listing.status]}`}
              >
                {STATUS_LABEL[listing.status]}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu barang">
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/listing/${listing.id}/edit`}>
                    <Pencil size={14} />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(["available", "reserved", "sold"] as const)
                  .filter((s) => s !== listing.status)
                  .map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => updateStatus(listing, s)}>
                      Tandai {STATUS_LABEL[s]}
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    setDeleteTarget(listing);
                  }}
                >
                  <Trash2 size={14} />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus barang ini?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; akan dihapus permanen dan tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
