"use client";

import { CircleAlert, ImagePlus, Loader2, MapPin, X } from "lucide-react";
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
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import type { Category, Listing } from "@my-cod/shared-types";

type ListingFormProps = {
  token: string;
  userId: string;
} & (
  | { mode: "create"; location: { lat: number; lng: number; source: string } }
  | { mode: "edit"; listing: Listing }
);

export function ListingForm(props: ListingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editing = props.mode === "edit" ? props.listing : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(editing ? String(editing.price) : "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [existingPhotos, setExistingPhotos] = useState<string[]>(editing?.photos ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existingPhotos.length + files.length === 0) {
      setError("Tambahkan minimal 1 foto barang.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const uploadedPhotos = await Promise.all(
        files.map(async (file) => {
          const path = `${props.userId}/${crypto.randomUUID()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("listing-photos")
            .upload(path, file);
          if (uploadError) throw uploadError;
          return supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
        }),
      );
      const photos = [...existingPhotos, ...uploadedPhotos];

      if (props.mode === "create") {
        const listing = await apiFetch<Listing>("/listings", {
          method: "POST",
          token: props.token,
          body: {
            title,
            description,
            price: Number(price),
            category_id: categoryId,
            photos,
            lat: props.location.lat,
            lng: props.location.lng,
          },
        });
        toast.success("Barang berhasil dipublikasikan!");
        router.push(`/listing/${listing.id}`);
      } else {
        const listing = await apiFetch<Listing>(`/listings/${props.listing.id}`, {
          method: "PATCH",
          token: props.token,
          body: { title, description, price: Number(price), category_id: categoryId, photos },
        });
        toast.success("Perubahan barang disimpan!");
        router.push(`/listing/${listing.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan barang.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-6">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Foto barang</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-wrap gap-2">
          {existingPhotos.map((url, i) => (
            <div key={url} className="relative h-20 w-20 shrink-0">
              <Image src={url} alt="" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
              <Button
                type="button"
                onClick={() => removeExistingPhoto(i)}
                aria-label="Hapus foto"
                size="icon"
                className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-foreground text-background hover:bg-foreground/80"
              >
                <X size={12} strokeWidth={2.5} />
              </Button>
            </div>
          ))}
          {files.map((file, i) => (
            <div key={i} className="relative h-20 w-20 shrink-0">
              <Image
                src={URL.createObjectURL(file)}
                alt=""
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-xl object-cover"
              />
              <Button
                type="button"
                onClick={() => removeFile(i)}
                aria-label="Hapus foto"
                size="icon"
                className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-foreground text-background hover:bg-foreground/80"
              >
                <X size={12} strokeWidth={2.5} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 shrink-0 flex-col gap-1 rounded-xl border-2 border-dashed text-muted-foreground"
          >
            <ImagePlus size={20} strokeWidth={1.75} />
            <span className="text-[11px]">Tambah</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Sepeda lipat masih bagus"
          className="h-11 rounded-xl bg-surface text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price">Harga</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
          <Input
            id="price"
            required
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 rounded-xl bg-surface pl-9 text-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Kategori</Label>
        <Select required value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category" className="h-11 w-full rounded-xl bg-surface text-base">
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
          placeholder="Kondisi barang, alasan jual, dll."
          className="rounded-xl bg-surface text-base"
        />
      </div>

      {props.mode === "create" && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          Lokasi barang disimpan sebagai area umum di sekitar{" "}
          {props.location.source === "gps" ? "posisi kamu saat ini" : "kota kamu"}, bukan alamat persis.
        </p>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <CircleAlert size={15} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitting} className="h-12 rounded-xl text-base font-medium">
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {submitting ? "Menyimpan…" : props.mode === "create" ? "Publikasikan" : "Simpan Perubahan"}
      </Button>
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
