"use client";

import { Home, MessageCircle, Plus, Search, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LEFT_ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/search", label: "Cari", icon: Search },
];

const RIGHT_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profil", icon: User },
];

/** Routes that take over the whole screen (chat thread, forms) hide the bar. */
const HIDDEN_ON = ["/login", "/post", "/chat/", "/listing/"];

export function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p))) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t-2 border-border bg-surface/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-center gap-1">
        {LEFT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}

        <li className="flex flex-[1.6] justify-center px-1">
          <Link
            href="/post"
            aria-label="Jual barang"
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-black uppercase tracking-wide text-primary-foreground brutalist-shadow"
          >
            <Plus size={18} strokeWidth={3} />
            Jual
          </Link>
        </li>

        {RIGHT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <li className="flex flex-1 justify-center">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="flex w-full flex-col items-center gap-1 py-2 text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center transition-all duration-300",
            active && "border-2 border-primary bg-primary text-primary-foreground brutalist-shadow",
          )}
        >
          <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </span>
        <span className={cn("uppercase tracking-wide", active && "font-black text-primary")}>{label}</span>
      </Link>
    </li>
  );
}
