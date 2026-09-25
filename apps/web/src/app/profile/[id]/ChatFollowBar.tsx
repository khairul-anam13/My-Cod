"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Chat deep-links into the seller's first active listing, since every
 * conversation is tied to a listing_id in the schema — there's no
 * "message this seller" endpoint independent of a listing yet.
 *
 * Follow is UI-only for now: there's no `follows` table or endpoint in the
 * backend, so this toggle doesn't persist across reloads. Wire it up once
 * that feature exists.
 */
export function ChatFollowBar({ firstListingId }: { firstListingId: string | null }) {
  const [following, setFollowing] = useState(false);

  const buttons = (
    <>
      {firstListingId ? (
        <Button asChild variant="outline" className="h-12 flex-1 gap-2 rounded-full">
          <Link href={`/listing/${firstListingId}`}>
            <MessageCircle size={17} />
            Chat
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled className="h-12 flex-1 gap-2 rounded-full">
          <MessageCircle size={17} />
          Chat
        </Button>
      )}
      <Button
        variant={following ? "outline" : "brutalist"}
        className="h-12 flex-1 rounded-full"
        onClick={() => setFollowing((v) => !v)}
      >
        {following ? "Mengikuti" : "Ikuti"}
      </Button>
    </>
  );

  return (
    <>
      <div className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 px-4">
        <div className="mx-auto flex max-w-md gap-3 rounded-2xl border-2 border-border bg-surface/95 p-3 shadow-2xl backdrop-blur-md">
          {buttons}
        </div>
      </div>

      <div className="hidden md:flex gap-3">{buttons}</div>
    </>
  );
}
