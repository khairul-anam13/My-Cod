"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import type { Category } from "@my-cod/shared-types";

// Descriptive copy for the featured tile — no photo, since this project has
// already been bitten once by hotlinked Unsplash URLs going dead (see seed
// data fixes); a plain icon+gradient tile has no such external dependency.
const TAGLINES: Record<string, string> = {
  Makanan: "Jajanan & masakan rumahan",
  Elektronik: "Laptop, HP & gadget lainnya",
  Otomotif: "Motor, mobil & sparepart",
  Pakaian: "Baju, sepatu & aksesoris",
  Jasa: "Servis & bantuan warga sekitar",
};

export function CategoryHighlights() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  const [featured, ...rest] = categories;
  const FeaturedIcon = CATEGORY_ICONS[featured.icon ?? ""] ?? DEFAULT_CATEGORY_ICON;

  return (
    <section className="px-4 pt-5">
      <h2 className="mb-3 text-base font-black text-foreground">Kategori</h2>

      <Link
        href={`/search?category=${featured.id}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-transparent p-4"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FeaturedIcon size={22} />
        </span>
        <div className="min-w-0">
          <p className="font-black text-foreground">{featured.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {TAGLINES[featured.name] ?? `Lihat semua barang ${featured.name}`}
          </p>
        </div>
      </Link>

      {rest.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {rest.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon ?? ""] ?? DEFAULT_CATEGORY_ICON;
            return (
              <Link
                key={c.id}
                href={`/search?category=${c.id}`}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                  <Icon size={17} />
                </span>
                <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
