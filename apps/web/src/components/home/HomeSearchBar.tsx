import { Search } from "lucide-react";
import Link from "next/link";

/**
 * Mobile-only tap-to-search bar on the Beranda home feed. Like MobileHeader's
 * search pill, this navigates to /search rather than acting as a live input —
 * search lives on its own screen, like a native app.
 */
export function HomeSearchBar() {
  return (
    <Link
      href="/search"
      aria-label="Cari barang"
      className="mx-4 mt-4 flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-3.5 text-sm text-muted-foreground"
    >
      <Search size={17} />
      Cari apa aja di sekitarmu…
    </Link>
  );
}
