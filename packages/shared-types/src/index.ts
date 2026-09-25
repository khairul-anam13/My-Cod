// Shared types between apps/web and apps/api, mirroring the Supabase schema
// defined in supabase/migrations. Keep in sync with the SQL source of truth.

export type ListingStatus = "available" | "reserved" | "sold";
export type CodMeetupStatus = "scheduled" | "completed" | "cancelled";
export type ReportReason =
  | "penipuan"
  | "barang_tidak_sesuai"
  | "no_show"
  | "lainnya";
export type ReportStatus = "pending" | "reviewed" | "resolved";
export type Role = "user" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  phone_number: string;
  name: string;
  profile_photo_url: string | null;
  city: string;
  lat: number;
  lng: number;
  is_verified: boolean;
  /** Public-safe flag — true once an admin approves the identity_verifications submission (Fase 4). */
  identity_verified: boolean;
  rating_avg: number;
  created_at: string;
}

// Kecamatan
export interface District {
  id: string;
  code: string;
  name: string;
}

// Kelurahan/Desa
export interface Village {
  id: string;
  district_id: string;
  code: string;
  name: string;
}

// The user's structured address — lives on profiles, exposed through its own
// endpoints since it has its own 30-day update-cooldown rule (PRD: address
// changes are restricted; basic profile fields like name/phone aren't).
export interface UserAddress {
  district_id: string | null;
  village_id: string | null;
  address_detail: string | null;
  lat: number | null;
  lng: number | null;
  last_address_updated_at: string | null;
  can_update_now: boolean;
  next_update_allowed_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  photos: string[];
  lat: number;
  lng: number;
  status: ListingStatus;
  created_at: string;
}

// Result shape of the nearby-listings RPC (listing + seller preview + distance).
export interface NearbyListing extends Listing {
  distance_m: number;
  seller_name: string;
  seller_rating_avg: number;
  seller_is_verified: boolean;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

export interface CodMeetup {
  id: string;
  conversation_id: string;
  meetup_location: string;
  meetup_time: string;
  status: CodMeetupStatus;
}

export interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_listing_id: string | null;
  reason: ReportReason;
  status: ReportStatus;
  created_at: string;
}

// ---- API request/response DTOs ----

export interface NearbySearchQuery {
  lat: number;
  lng: number;
  radius_km?: number;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

export interface UpsertProfileInput {
  name: string;
  phone_number: string;
  city: string;
  lat: number;
  lng: number;
  profile_photo_url?: string;
}

export interface UpsertAddressInput {
  district_id: string;
  village_id: string;
  address_detail: string;
  lat: number;
  lng: number;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category_id: string;
  photos: string[];
  lat: number;
  lng: number;
}

export interface UpdateListingInput {
  title: string;
  description: string;
  price: number;
  category_id: string;
  photos: string[];
}

export interface CreateReviewInput {
  listing_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
}

export interface CreateReportInput {
  reported_user_id?: string;
  reported_listing_id?: string;
  reason: ReportReason;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ---- Identity verification (Fase 4) ----

export interface IdentityVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  ktp_photo_path: string | null;
  selfie_photo_path: string | null;
  phone_verified_at: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

export interface VerificationQueueItem {
  id: string;
  user_id: string;
  status: VerificationStatus;
  ktp_photo_path: string | null;
  selfie_photo_path: string | null;
  ktp_photo_url: string | null;
  selfie_photo_url: string | null;
  phone_verified_at: string | null;
  submitted_at: string;
  profile: { name: string; phone_number: string };
}

export interface SendPhoneOtpInput {
  phone_number: string;
}

export interface VerifyPhoneOtpInput {
  code: string;
}

export interface SubmitIdentityInput {
  ktp_photo_path: string;
  selfie_photo_path: string;
}

export interface ReviewIdentityInput {
  status: Extract<VerificationStatus, "verified" | "rejected">;
  rejection_reason?: string;
}
