"use client";

import { LayoutGrid, MessageCircle, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { SearchBox } from "@/components/layout/SearchBox";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";
import type { Category } from "@my-cod/shared-types";

/**
 * Desktop-only shell: a marketplace-style header (logo, prominent search,
 * category rail, sell CTA, account). Mobile gets MobileHeader + BottomNav
 * instead — see layout.tsx.
 */
export function DesktopHeader() {
  const pathname = usePathname();

  // Login is a focused, full-screen auth surface with its own branding.
  if (pathname === "/login") return null;

  return (
    <header className="hidden md:block sticky top-0 z-50 w-full border-b-2 border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-border bg-white">
            <Image src="/logo-cod.png" alt="" fill sizes="40px" className="object-contain p-1" />
          </div>
          <span className="text-2xl font-black italic tracking-tight text-foreground">
            My<span className="text-primary">COD</span>
          </span>
        </Link>

        <Suspense fallback={<div className="max-w-xl flex-1" />}>
          <HeaderSearchBox />
        </Suspense>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="brutalist" size="lg" className="h-11 px-5 text-sm">
            <Link href="/post">
              <Plus size={18} strokeWidth={4} />
              Jual Barang
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-lg" className="rounded-none" aria-label="Chat">
            <Link href="/chat">
              <MessageCircle size={20} />
            </Link>
          </Button>
          <AccountMenu />
        </div>
      </div>

      <CategoryRail />
    </header>
  );
}

function HeaderSearchBox() {
  const searchParams = useSearchParams();
  return (
    <div className="max-w-xl flex-1">
      <SearchBox defaultValue={searchParams.get("q") ?? ""} />
    </div>
  );
}

/** Category shortcuts — these deep-link into /search, not the Explore feed. */
function CategoryRail() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="border-t border-border/60 bg-surface/60">
      <nav
        aria-label="Kategori"
        className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-6 py-1.5"
      >
        <CategoryRailLink href="/search" label="Semua Kategori" Icon={LayoutGrid} active={pathname === "/search"} />
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon ?? ""] ?? DEFAULT_CATEGORY_ICON;
          return (
            <CategoryRailLink
              key={c.id}
              href={`/search?category=${c.id}`}
              label={c.name}
              Icon={Icon}
              active={false}
            />
          );
        })}
      </nav>
    </div>
  );
}

function CategoryRailLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}
