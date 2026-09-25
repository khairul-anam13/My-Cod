"use client";

import { Camera, CircleAlert, Loader2, Phone, UserRound } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { useLocation } from "@/hooks/useLocation";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import type { Profile, UserAddress } from "@my-cod/shared-types";
import { AddressFields, type AddressFormValue } from "./AddressFields";

const EMPTY_ADDRESS: AddressFormValue = {
  district_id: "",
  village_id: "",
  address_detail: "",
  lat: null,
  lng: null,
  accuracy: null,
};

function formatIndonesianDateTime(iso: string) {
  return (
    new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function EditProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/profile";
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic profile (no update restriction).
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Address (30-day update restriction).
  const [address, setAddress] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [addressReady, setAddressReady] = useState(false);
  const [canUpdateNow, setCanUpdateNow] = useState(true);
  const [nextUpdateAllowedAt, setNextUpdateAllowedAt] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace(`/login?next=${encodeURIComponent("/profile/edit")}`);
    }
  }, [sessionLoading, session, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<Profile | null>("/profiles/me/profile", { token: session.access_token })
      .then((profile) => {
        if (!profile) return;
        setName(profile.name);
        setPhoneNumber(profile.phone_number);
        setExistingPhotoUrl(profile.profile_photo_url ?? undefined);
      })
      .catch(() => {});

    apiFetch<UserAddress>("/profiles/me/address", { token: session.access_token })
      .then((addr) => {
        setAddress({
          district_id: addr.district_id ?? "",
          village_id: addr.village_id ?? "",
          address_detail: addr.address_detail ?? "",
          lat: addr.lat,
          lng: addr.lng,
          accuracy: null,
        });
        setCanUpdateNow(addr.can_update_now);
        setNextUpdateAllowedAt(addr.next_update_allowed_at);
      })
      .catch(() => {})
      .finally(() => setAddressReady(true));
  }, [session]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setProfileLoading(true);
    setProfileError(null);

    try {
      let profile_photo_url = existingPhotoUrl;

      if (photoFile) {
        const path = `${session.user.id}/${crypto.randomUUID()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        profile_photo_url = supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
      }

      await apiFetch("/profiles/me/profile", {
        method: "PUT",
        token: session.access_token,
        body: { name, phone_number: phoneNumber, lat: location.lat, lng: location.lng, profile_photo_url },
      });

      toast.success("Profil tersimpan! Lanjut lengkapi alamat di bawah.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setProfileLoading(false);
    }
  }

  const lockedNotice =
    !canUpdateNow && nextUpdateAllowedAt
      ? `Alamat cuma bisa diubah sekali tiap 30 hari. Kamu bisa mengubahnya lagi mulai ${formatIndonesianDateTime(nextUpdateAllowedAt)}.`
      : null;

  const addressIncomplete =
    !address.district_id || !address.village_id || !address.address_detail.trim() || address.lat === null || address.lng === null;

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    // Frontend validation mirrors the backend's rules so the user doesn't
    // wait on a round-trip just to be told what they could already see.
    if (!canUpdateNow) {
      setAddressError(lockedNotice);
      return;
    }
    if (addressIncomplete) {
      setAddressError("Lengkapi kecamatan, kelurahan, alamat detail, dan titik lokasi di peta.");
      return;
    }

    setAddressLoading(true);
    setAddressError(null);
    try {
      const result = await apiFetch<UserAddress>("/profiles/me/address", {
        method: "PUT",
        token: session.access_token,
        body: {
          district_id: address.district_id,
          village_id: address.village_id,
          address_detail: address.address_detail,
          lat: address.lat,
          lng: address.lng,
          accuracy: address.accuracy,
        },
      });
      setCanUpdateNow(result.can_update_now);
      setNextUpdateAllowedAt(result.next_update_allowed_at);
      toast.success("Alamat berhasil disimpan!");
      router.replace(next);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Gagal menyimpan alamat.");
    } finally {
      setAddressLoading(false);
    }
  }

  if (sessionLoading || !session) return null;

  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : existingPhotoUrl;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <BackButton />
        <div>
          <h1 className="text-base font-semibold text-foreground">Lengkapi Profil</h1>
          <p className="text-xs text-muted-foreground">Terlihat oleh warga lain saat jual/beli</p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5 px-6">
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
          >
            <Avatar className="h-24 w-24 border-2 border-dashed border-border">
              <AvatarImage src={previewUrl} alt="" />
              <AvatarFallback>
                <UserRound size={32} strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera size={14} />
            </span>
          </button>
          <p className="text-xs text-muted-foreground">Foto profil (opsional)</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama</Label>
          <div className="relative">
            <UserRound size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-surface pl-10 text-base"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Nomor HP</Label>
          <div className="relative">
            <Phone size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              required
              type="tel"
              inputMode="numeric"
              placeholder="08123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-11 rounded-xl bg-surface pl-10 text-base"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Dipakai warga lain untuk koordinasi COD. Nomor ini belum diverifikasi otomatis — pastikan
            nomornya benar & aktif.
          </p>
        </div>

        {profileError && (
          <Alert variant="destructive" className="rounded-xl">
            <CircleAlert size={15} />
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={profileLoading} className="h-11 rounded-xl text-base font-medium">
          {profileLoading && <Loader2 size={17} className="animate-spin" />}
          {profileLoading ? "Menyimpan…" : "Simpan Profil"}
        </Button>
      </form>

      <div className="border-t-2 border-border px-6 pt-6">
        <h2 className="mb-1 text-base font-semibold text-foreground">Alamat</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Kecamatan, kelurahan/desa, dan titik lokasi rumah — dipakai untuk menampilkan barang terdekat.
          Kabupaten Karanganyar saja untuk saat ini.
        </p>

        {!addressReady ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleAddressSubmit} className="flex flex-col gap-5">
            <AddressFields
              value={address}
              onChange={setAddress}
              disabled={!canUpdateNow}
              lockedNotice={lockedNotice}
            />

            {addressError && (
              <Alert variant="destructive" className="rounded-xl">
                <CircleAlert size={15} />
                <AlertDescription>{addressError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={addressLoading || !canUpdateNow}
              className="h-11 rounded-xl text-base font-medium"
            >
              {addressLoading && <Loader2 size={17} className="animate-spin" />}
              {addressLoading ? "Menyimpan…" : "Simpan Alamat"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={null}>
      <EditProfileForm />
    </Suspense>
  );
}
