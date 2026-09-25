import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Listing, Profile, Review } from "@my-cod/shared-types";
import { ProfileView } from "./ProfileView";

interface ReviewWithReviewer extends Review {
  reviewer: { id: string; name: string; profile_photo_url: string | null };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await apiFetch<Profile | null>(`/profiles/${id}`).catch(() => null);
  if (!profile) notFound();

  const [listings, reviews] = await Promise.all([
    apiFetch<Listing[]>(`/listings?seller_id=${id}`).catch(() => []),
    apiFetch<ReviewWithReviewer[]>(`/reviews/user/${id}`).catch(() => []),
  ]);

  return <ProfileView profile={profile} listings={listings} reviews={reviews} />;
}
