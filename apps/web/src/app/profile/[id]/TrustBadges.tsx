import { BadgeCheck, Star, ThumbsUp, Zap, type LucideIcon } from "lucide-react";

/**
 * Each badge is gated behind a real signal we already have (verification,
 * rating, review/listing counts) — no fabricated "fast responder" style
 * metrics that would need response-time tracking we don't collect.
 */
export function TrustBadges({
  isVerified,
  ratingAvg,
  reviewCount,
  listingCount,
}: {
  isVerified: boolean;
  ratingAvg: number;
  reviewCount: number;
  listingCount: number;
}) {
  const badges: { icon: LucideIcon; label: string }[] = [];

  if (isVerified) badges.push({ icon: BadgeCheck, label: "Identitas Terverifikasi" });
  if (reviewCount > 0 && ratingAvg >= 4.5) badges.push({ icon: Star, label: "Rating Tinggi" });
  if (listingCount >= 3) badges.push({ icon: Zap, label: "Penjual Aktif" });
  if (reviewCount >= 5 && ratingAvg >= 4) badges.push({ icon: ThumbsUp, label: "Direkomendasikan" });

  if (badges.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-foreground">
        Lencana Kepercayaan
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {badges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex min-w-[76px] flex-col items-center gap-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-surface text-primary">
              <Icon size={26} />
            </span>
            <span className="text-center text-[10px] font-semibold leading-tight text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
