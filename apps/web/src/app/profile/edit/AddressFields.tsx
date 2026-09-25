"use client";

import { CircleAlert, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { District, Village } from "@my-cod/shared-types";

const DEFAULT_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_DEFAULT_CITY_LAT ?? "-7.6011"),
  Number(process.env.NEXT_PUBLIC_DEFAULT_CITY_LNG ?? "110.9432"),
];

export interface AddressFormValue {
  district_id: string;
  village_id: string;
  address_detail: string;
  lat: number | null;
  lng: number | null;
  /** From the browser's Geolocation API when "Lokasi Saya" was used — null for a manual map tap. */
  accuracy: number | null;
}

export function AddressFields({
  value,
  onChange,
  disabled,
  lockedNotice,
}: {
  value: AddressFormValue;
  onChange: (next: AddressFormValue) => void;
  disabled: boolean;
  /** Friendly "you can change this again on <date>" message when the 30-day cooldown is active. */
  lockedNotice: string | null;
}) {
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [villages, setVillages] = useState<Village[] | null>(null);
  const [loadingVillages, setLoadingVillages] = useState(false);

  useEffect(() => {
    apiFetch<District[]>("/districts")
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    if (!value.district_id) {
      setVillages([]);
      return;
    }
    setLoadingVillages(true);
    apiFetch<Village[]>(`/villages?district_id=${value.district_id}`)
      .then(setVillages)
      .catch(() => setVillages([]))
      .finally(() => setLoadingVillages(false));
  }, [value.district_id]);

  return (
    <div className="flex flex-col gap-5">
      {lockedNotice && (
        <Alert className="rounded-xl border-primary/40 bg-primary-soft">
          <CircleAlert size={15} className="text-primary-soft-foreground" />
          <AlertDescription className="text-primary-soft-foreground">{lockedNotice}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="district">Kecamatan</Label>
        {districts === null ? (
          <Skeleton className="h-11 w-full rounded-xl" />
        ) : (
          <Select
            value={value.district_id}
            disabled={disabled}
            onValueChange={(districtId) => onChange({ ...value, district_id: districtId, village_id: "" })}
          >
            <SelectTrigger id="district" className="h-11 w-full rounded-xl bg-surface text-base">
              <SelectValue placeholder="Pilih kecamatan" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="village">Kelurahan/Desa</Label>
        {loadingVillages ? (
          <Skeleton className="h-11 w-full rounded-xl" />
        ) : (
          <Select
            value={value.village_id}
            disabled={disabled || !value.district_id}
            onValueChange={(villageId) => onChange({ ...value, village_id: villageId })}
          >
            <SelectTrigger id="village" className="h-11 w-full rounded-xl bg-surface text-base">
              <SelectValue
                placeholder={value.district_id ? "Pilih kelurahan/desa" : "Pilih kecamatan dulu"}
              />
            </SelectTrigger>
            <SelectContent>
              {(villages ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address_detail">Alamat Lengkap</Label>
        <Textarea
          id="address_detail"
          required
          disabled={disabled}
          rows={3}
          value={value.address_detail}
          onChange={(e) => onChange({ ...value, address_detail: e.target.value })}
          placeholder="Nama jalan, RT/RW, patokan..."
          className="rounded-xl bg-surface text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Titik Lokasi (Rumah)</Label>
        <div className="h-64 w-full overflow-hidden rounded-xl border border-border">
          <LocationPicker
            value={value.lat !== null && value.lng !== null ? { lat: value.lat, lng: value.lng } : null}
            defaultCenter={DEFAULT_CENTER}
            disabled={disabled}
            onPick={(lat, lng, accuracy) => {
              onChange({ ...value, lat, lng, accuracy: accuracy ?? null });
              // Suggest-fill only — never overwrite text the user already typed.
              if (!value.address_detail.trim()) {
                apiFetch<{ display_name: string | null }>(`/geocode/reverse?lat=${lat}&lng=${lng}`)
                  .then(({ display_name }) => {
                    if (display_name) onChange({ ...value, lat, lng, accuracy: accuracy ?? null, address_detail: display_name });
                  })
                  .catch(() => {});
              }
            }}
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={13} className="shrink-0" />
          {value.lat !== null && value.lng !== null
            ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
            : "Ketuk peta untuk menandai lokasi rumah kamu"}
        </p>
      </div>
    </div>
  );
}
