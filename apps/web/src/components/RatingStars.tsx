import { Star } from "lucide-react";

export function RatingStars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(rating);
  const iconSize = size === "md" ? 16 : 13;

  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      aria-label={`Rating ${rating.toFixed(1)} dari 5`}
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={iconSize}
            className={i < rounded ? "fill-accent text-accent" : "fill-border text-border"}
          />
        ))}
      </span>
      <span className="tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}
