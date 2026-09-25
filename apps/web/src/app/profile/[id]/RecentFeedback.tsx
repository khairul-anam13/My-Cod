"use client";

import { useState } from "react";
import { RatingStars } from "@/components/RatingStars";
import { formatRelativeTime } from "@/lib/format";
import type { Review } from "@my-cod/shared-types";

interface ReviewWithReviewer extends Review {
  reviewer: { id: string; name: string; profile_photo_url: string | null };
}

const COLLAPSED_COUNT = 2;

export function RecentFeedback({ reviews }: { reviews: ReviewWithReviewer[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, COLLAPSED_COUNT);

  return (
    <section>
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-foreground">
        Ulasan Terbaru ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada ulasan.</p>
      ) : (
        <>
          <div className="divide-y divide-border border-2 border-border bg-surface">
            {visible.map((review) => (
              <div key={review.id} className="flex flex-col gap-1.5 p-3.5">
                {review.comment && <p className="text-sm text-foreground">&ldquo;{review.comment}&rdquo;</p>}
                <div className="flex items-center gap-2">
                  <RatingStars rating={review.rating} />
                  <span className="text-xs text-muted-foreground">— {review.reviewer.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatRelativeTime(review.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 w-full py-1 text-center text-xs font-bold uppercase tracking-wide text-primary"
            >
              {expanded ? "Sembunyikan" : "Lihat Semua Ulasan"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
