"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import type { Category } from "@my-cod/shared-types";

export interface SearchFilters {
  categoryId: string;
  radiusKm: number;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_FILTERS: SearchFilters = {
  categoryId: "",
  radiusKm: 10,
  minPrice: "",
  maxPrice: "",
};

export const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50];

export function countActiveFilters(f: SearchFilters) {
  let n = 0;
  if (f.categoryId) n++;
  if (f.radiusKm !== DEFAULT_FILTERS.radiusKm) n++;
  if (f.minPrice || f.maxPrice) n++;
  return n;
}

/**
 * The filter form itself, with no surrounding chrome — rendered inside a
 * sticky sidebar on desktop and inside a bottom sheet on mobile, so both
 * breakpoints share one implementation and one set of design tokens.
 */
export function FilterControls({
  value,
  onChange,
  categories,
}: {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  categories: Category[];
}) {
  const set = <K extends keyof SearchFilters>(key: K, v: SearchFilters[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-black uppercase tracking-wide text-foreground">Kategori</legend>
        <CategoryOption
          label="Semua Kategori"
          Icon={LayoutGrid}
          active={value.categoryId === ""}
          onClick={() => set("categoryId", "")}
        />
        {categories.map((c) => (
          <CategoryOption
            key={c.id}
            label={c.name}
            Icon={CATEGORY_ICONS[c.icon ?? ""] ?? DEFAULT_CATEGORY_ICON}
            active={value.categoryId === c.id}
            onClick={() => set("categoryId", c.id)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-black uppercase tracking-wide text-foreground">Jarak maksimum</legend>
        <RadioGroup
          value={String(value.radiusKm)}
          onValueChange={(v) => set("radiusKm", Number(v))}
          className="gap-2"
        >
          {RADIUS_OPTIONS.map((r) => (
            <Label key={r} htmlFor={`radius-${r}`} className="cursor-pointer gap-2.5 font-normal">
              <RadioGroupItem id={`radius-${r}`} value={String(r)} />
              Dalam {r} km
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-black uppercase tracking-wide text-foreground">Rentang harga</legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Harga minimum"
            value={value.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            className="h-10 rounded-none border-2"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Harga maksimum"
            value={value.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            className="h-10 rounded-none border-2"
          />
        </div>
      </fieldset>
    </div>
  );
}

function CategoryOption({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof LayoutGrid;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-auto justify-start gap-2 rounded-none border-2 px-3 py-2 text-sm font-bold transition-all",
        active
          ? "border-primary bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <Icon size={15} />
      {label}
    </Button>
  );
}
