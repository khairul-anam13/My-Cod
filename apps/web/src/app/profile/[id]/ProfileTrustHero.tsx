import { BadgeCheck, Handshake, MessageSquare, Star, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Trust score is derived from the seller's real rating_avg (there's no
 * separate backend trust metric yet) — a straightforward 0-100 read of the
 * 0-5 rating. New sellers with zero reviews get a neutral "Anggota Baru"
 * state instead of a misleading 0% ring.
 */
function trustTier(ratingAvg: number, reviewCount: number) {
  if (reviewCount === 0) return { score: 0, label: "Anggota Baru" };
  const score = Math.round(Math.min(100, (ratingAvg / 5) * 100));
  if (score >= 90) return { score, label: "Penjual Elite" };
  if (score >= 70) return { score, label: "Penjual Terpercaya" };
  return { score, label: "Penjual Baru" };
}

export function ProfileTrustHero({
  name,
  photoUrl,
  isVerified,
  memberSinceYear,
  soldCount,
  reviewCount,
  ratingAvg,
}: {
  name: string;
  photoUrl: string | null;
  isVerified: boolean;
  memberSinceYear: number;
  soldCount: number;
  reviewCount: number;
  ratingAvg: number;
}) {
  const { score, label } = trustTier(ratingAvg, reviewCount);
  const dashOffset = RING_CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="relative mt-10 flex flex-col items-center border-2 border-border bg-surface px-4 pt-12 pb-6">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2">
        <Avatar className="h-20 w-20 border-4 border-background">
          <AvatarImage src={photoUrl ?? undefined} alt={name} />
          <AvatarFallback>
            <UserRound size={28} />
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-lg font-black uppercase tracking-wide text-foreground">{name}</h1>
          {isVerified && <BadgeCheck size={16} className="shrink-0 fill-accent text-surface" />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Bergabung sejak {memberSinceYear}</p>
      </div>

      <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="z-10 flex flex-col items-center text-center">
          {reviewCount > 0 && <span className="text-3xl font-black text-primary">{score}%</span>}
          <span className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 divide-x divide-border border-t border-border pt-4">
        <Stat icon={<Handshake size={16} />} value={soldCount} label="Terjual" />
        <Stat icon={<MessageSquare size={16} />} value={reviewCount} label="Ulasan" />
        <Stat
          icon={<Star size={16} className="fill-accent text-accent" />}
          value={ratingAvg.toFixed(1)}
          label="Rating"
        />
      </div>

      {isVerified && (
        <Badge className="absolute right-3 top-3 gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary-soft-foreground">
          <BadgeCheck size={11} />
          Terverifikasi
        </Badge>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 text-center">
      <div className="flex items-center gap-1 text-primary">
        {icon}
        <span className="text-lg font-black text-foreground">{value}</span>
      </div>
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
    </div>
  );
}
