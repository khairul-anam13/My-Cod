"use client";

import { CircleAlert, ImagePlus, Loader2, MapPin, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LocationState } from "@/hooks/useLocation";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import type { Category, Listing } from "@my-cod/shared-types";

const MAX_PHOTOS = 10;

/**
 * Create-only listing form with its own header (X / title / Posting action),
 * built as a dedicated component rather than extending the shared
 * ListingForm — that one also drives /listing/[id]/edit and this redesign
 * shouldn't change that page's look.
 */
export function NewListingForm({
  token,
  userId,
  location,
}: {
  token: string;
  userId: string;
  location: LocationState;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)].slice(0, MAX_PHOTOS));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Tambahkan minimal 1 foto barang.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const photos = await Promise.all(
        files.map(async (file) => {
          const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file);
          if (uploadError) throw uploadError;
          return supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
        }),
      );

      const listing = await apiFetch<Listing>("/listings", {
        method: "POST",
        token,
        body: {
          title,
          description,
          price: Number(price),
          category_id: categoryId,
          photos,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
        },
      });
      toast.success("Barang berhasil dipublikasikan!");
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan barang.");
    } finally {
      setSubmitting(false);
    }
  }

  const canAddMore = files.length < MAX_PHOTOS;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-2 py-3 backdrop-blur-md">
        <Button
          type="button"
          onClick={() => router.back()}
          aria-label="Tutup"
          variant="ghost"
          size="icon-lg"
          className="rounded-full text-foreground hover:bg-surface-muted"
        >
          <X size={20} />
        </Button>
        <h1 className="text-base font-black text-foreground">Listing Baru</h1>
        <Button type="submit" disabled={submitting} variant="brutalist" className="h-9 px-4 text-xs">
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? "Mengirim…" : "Posting"}
        </Button>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        <div>
          <Label className="mb-2 block">Foto barang</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
          <div className="grid grid-cols-3 gap-2">
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 border-2 border-dashed border-border text-muted-foreground"
              >
                <ImagePlus size={22} strokeWidth={1.75} />
                <span className="text-[11px] font-medium">Tambah Foto</span>
              </button>
            )}
            {files.map((file, i) => (
              <div key={i} className="relative aspect-square">
                <Image
                  src={URL.createObjectURL(file)}
                  alt=""
                  fill
                  unoptimized
                  className="border-2 border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label="Hapus foto"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Foto pertama jadi sampul. Kamu bisa tambah hingga {MAX_PHOTOS} foto.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Sepeda lipat masih bagus"
            className="h-11 rounded-none border-2 bg-surface text-base"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Harga</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="price"
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-11 rounded-none border-2 bg-surface pl-9 text-base"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select required value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category" className="h-11 w-full rounded-none border-2 bg-surface text-base">
              <CategoryLeadingIcon categoryId={categoryId} categories={categories} />
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsikan barangmu... (merek, kondisi, alasan jual)"
            className="rounded-none border-2 bg-surface text-base"
          />
        </div>

        <div className="flex items-center gap-2.5 border-2 border-border bg-surface-muted p-3.5">
          <MapPin size={18} className="shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">COD saja.</span> My COD cuma untuk transaksi ketemu
            langsung, barang disimpan sebagai area umum di sekitar{" "}
            {location.source === "gps" ? "posisi kamu saat ini" : "kota kamu"}.
          </p>
        </div>

        <div className="flex gap-2.5 border-2 border-border bg-surface p-3.5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Rekomendasi Lokasi Aman</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Sepakati ketemu di tempat umum yang ramai, seperti minimarket, kantor polisi, atau pusat
              perbelanjaan terdekat.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-none border-2 border-danger">
            <CircleAlert size={15} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </form>
  );
}

function CategoryLeadingIcon({
  categoryId,
  categories,
}: {
  categoryId: string;
  categories: Category[];
}) {
  const selected = categories.find((c) => c.id === categoryId);
  const Icon = CATEGORY_ICONS[selected?.icon ?? ""] ?? DEFAULT_CATEGORY_ICON;
  return (
    <span className="pointer-events-none shrink-0 text-muted-foreground">
      <Icon size={17} />
    </span>
  );
}
