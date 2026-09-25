"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({ variant = "default" }: { variant?: "default" | "overlay" }) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      aria-label="Kembali"
      variant="ghost"
      size="icon-lg"
      className={cn(
        "rounded-full",
        variant === "overlay"
          ? "bg-black/45 text-white backdrop-blur-sm hover:bg-black/60 hover:text-white"
          : "text-foreground hover:bg-surface-muted",
      )}
    >
      <ChevronLeft size={20} strokeWidth={2.25} />
    </Button>
  );
}
