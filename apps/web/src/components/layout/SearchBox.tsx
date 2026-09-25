"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Submits to the detailed search page (/search), which owns all filtering. */
export function SearchBox({
  defaultValue = "",
  className,
  autoFocus,
}: {
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)} role="search">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        name="q"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari barang di sekitarmu…"
        aria-label="Cari barang"
        className="h-11 w-full rounded-none border-2 border-border bg-surface pl-10 text-base focus-visible:border-primary"
      />
    </form>
  );
}
