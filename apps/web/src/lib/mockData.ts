import type { Category, Listing, NearbyListing, Profile, Review } from "@my-cod/shared-types";

/**
 * Fixture data for visual checking while no Supabase Cloud project is wired
 * up (see .env.local — NEXT_PUBLIC_USE_MOCK_DATA). Covers only *public,
 * unauthenticated* read endpoints (categories, listings, public profiles,
 * reviews) — anything behind login (chat, own profile, posting, admin,
 * verification) needs a real Supabase Auth session to mean anything, mock
 * data can't substitute for that. Shapes mirror supabase/seed.sql so this
 * stays consistent with real data once connected.
 */

const CATEGORIES: Category[] = [
  { id: "c0000000-0000-4000-8000-000000000001", name: "Makanan", icon: "Utensils" },
  { id: "c0000000-0000-4000-8000-000000000002", name: "Elektronik", icon: "Laptop" },
  { id: "c0000000-0000-4000-8000-000000000003", name: "Otomotif", icon: "Car" },
  { id: "c0000000-0000-4000-8000-000000000004", name: "Pakaian", icon: "Shirt" },
  { id: "c0000000-0000-4000-8000-000000000005", name: "Jasa", icon: "Wrench" },
];

const [MAKANAN, ELEKTRONIK, OTOMOTIF, PAKAIAN, JASA] = CATEGORIES.map((c) => c.id);

const LISTINGS: NearbyListing[] = [
  {
    id: "d0000000-0000-4000-8000-000000000001",
    seller_id: "a0000000-0000-4000-8000-000000000001",
    title: "iPhone 13 Pro 256GB Mulus",
    description: "Dijual cepat iPhone 13 Pro warna Sierra Blue. COD sekitar Tawangmangu.",
    price: 12_500_000,
    category_id: ELEKTRONIK,
    photos: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500"],
    lat: -7.6021,
    lng: 110.944,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 850,
    seller_name: "Budi Santoso",
    seller_rating_avg: 4.8,
    seller_is_verified: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    seller_id: "a0000000-0000-4000-8000-000000000002",
    title: "Nasi Liwet Bu Siti, siap antar",
    description: "Nasi liwet komplit ayam + telur pindang, porsi keluarga.",
    price: 45_000,
    category_id: MAKANAN,
    photos: ["https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500"],
    lat: -7.599,
    lng: 110.941,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 420,
    seller_name: "Siti Rahma",
    seller_rating_avg: 4.9,
    seller_is_verified: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000003",
    seller_id: "a0000000-0000-4000-8000-000000000001",
    title: "Helm Bogo Retro Hitam Doff",
    description: "Kondisi 95%, busa tebal, jarang dipakai.",
    price: 150_000,
    category_id: OTOMOTIF,
    photos: ["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500"],
    lat: -7.605,
    lng: 110.938,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 1_240,
    seller_name: "Budi Santoso",
    seller_rating_avg: 4.8,
    seller_is_verified: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000004",
    seller_id: "a0000000-0000-4000-8000-000000000003",
    title: "Jaket Jeans Vintage Uk. L",
    description: "Bahan tebal, tanpa cacat, cocok buat daerah dingin Tawangmangu.",
    price: 85_000,
    category_id: PAKAIAN,
    photos: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
    lat: -7.603,
    lng: 110.947,
    status: "reserved",
    created_at: new Date().toISOString(),
    distance_m: 1_890,
    seller_name: "Andi Pratama",
    seller_rating_avg: 4.6,
    seller_is_verified: false,
  },
  {
    id: "d0000000-0000-4000-8000-000000000005",
    seller_id: "a0000000-0000-4000-8000-000000000004",
    title: "Servis AC Rumahan, Panggilan",
    description: "Cuci AC, isi freon, cek kebocoran. Berpengalaman 8 tahun.",
    price: 120_000,
    category_id: JASA,
    photos: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"],
    lat: -7.598,
    lng: 110.936,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 2_100,
    seller_name: "Joko Susilo",
    seller_rating_avg: 4.5,
    seller_is_verified: false,
  },
  {
    id: "d0000000-0000-4000-8000-000000000006",
    seller_id: "a0000000-0000-4000-8000-000000000002",
    title: "Laptop ASUS Vivobook 14\" i5",
    description: "RAM 8GB, SSD 512GB, box lengkap, garansi toko 3 bulan.",
    price: 5_200_000,
    category_id: ELEKTRONIK,
    photos: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"],
    lat: -7.607,
    lng: 110.943,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 3_050,
    seller_name: "Siti Rahma",
    seller_rating_avg: 4.9,
    seller_is_verified: true,
  },
  {
    id: "d0000000-0000-4000-8000-000000000007",
    seller_id: "a0000000-0000-4000-8000-000000000003",
    title: "Sepatu Sneakers Lokal Baru",
    description: "Ukuran 42, belum pernah dipakai keluar, masih ada nota.",
    price: 210_000,
    category_id: PAKAIAN,
    photos: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"],
    lat: -7.6,
    lng: 110.949,
    status: "sold",
    created_at: new Date().toISOString(),
    distance_m: 3_600,
    seller_name: "Andi Pratama",
    seller_rating_avg: 4.6,
    seller_is_verified: false,
  },
  {
    id: "d0000000-0000-4000-8000-000000000008",
    seller_id: "a0000000-0000-4000-8000-000000000004",
    title: "Jamu Kunir Asem Botolan",
    description: "Fermentasi tradisional, tanpa pengawet, isi 6 botol 250ml.",
    price: 30_000,
    category_id: MAKANAN,
    photos: ["https://images.unsplash.com/photo-1571167530149-c72f2b6d3b6c?w=500"],
    lat: -7.596,
    lng: 110.939,
    status: "available",
    created_at: new Date().toISOString(),
    distance_m: 4_400,
    seller_name: "Joko Susilo",
    seller_rating_avg: 4.5,
    seller_is_verified: false,
  },
];

type PublicProfile = Pick<
  Profile,
  "id" | "name" | "profile_photo_url" | "city" | "is_verified" | "identity_verified" | "rating_avg" | "created_at"
>;

const PROFILES: Record<string, PublicProfile> = {
  "a0000000-0000-4000-8000-000000000001": {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "Budi Santoso",
    profile_photo_url: null,
    city: "Kabupaten Karanganyar",
    is_verified: true,
    identity_verified: true,
    rating_avg: 4.8,
    created_at: "2025-01-10T00:00:00.000Z",
  },
  "a0000000-0000-4000-8000-000000000002": {
    id: "a0000000-0000-4000-8000-000000000002",
    name: "Siti Rahma",
    profile_photo_url: null,
    city: "Kabupaten Karanganyar",
    is_verified: true,
    identity_verified: true,
    rating_avg: 4.9,
    created_at: "2024-11-02T00:00:00.000Z",
  },
  "a0000000-0000-4000-8000-000000000003": {
    id: "a0000000-0000-4000-8000-000000000003",
    name: "Andi Pratama",
    profile_photo_url: null,
    city: "Kabupaten Karanganyar",
    is_verified: true,
    identity_verified: false,
    rating_avg: 4.6,
    created_at: "2025-03-20T00:00:00.000Z",
  },
  "a0000000-0000-4000-8000-000000000004": {
    id: "a0000000-0000-4000-8000-000000000004",
    name: "Joko Susilo",
    profile_photo_url: null,
    city: "Kabupaten Karanganyar",
    is_verified: false,
    identity_verified: false,
    rating_avg: 4.5,
    created_at: "2025-06-05T00:00:00.000Z",
  },
};

interface MockReview extends Review {
  reviewer: { id: string; name: string; profile_photo_url: string | null };
}

const REVIEWS: MockReview[] = [
  {
    id: "e0000000-0000-4000-8000-000000000001",
    listing_id: "d0000000-0000-4000-8000-000000000001",
    reviewer_id: "a0000000-0000-4000-8000-000000000002",
    reviewed_user_id: "a0000000-0000-4000-8000-000000000001",
    rating: 5,
    comment: "COD lancar, barang sesuai foto. Budi ramah dan tepat waktu.",
    created_at: "2025-08-01T10:00:00.000Z",
    reviewer: { id: "a0000000-0000-4000-8000-000000000002", name: "Siti Rahma", profile_photo_url: null },
  },
  {
    id: "e0000000-0000-4000-8000-000000000002",
    listing_id: "d0000000-0000-4000-8000-000000000003",
    reviewer_id: "a0000000-0000-4000-8000-000000000004",
    reviewed_user_id: "a0000000-0000-4000-8000-000000000001",
    rating: 5,
    comment: "Helm masih mulus, sesuai deskripsi. Recommended seller.",
    created_at: "2025-08-15T14:30:00.000Z",
    reviewer: { id: "a0000000-0000-4000-8000-000000000004", name: "Joko Susilo", profile_photo_url: null },
  },
  {
    id: "e0000000-0000-4000-8000-000000000003",
    listing_id: "d0000000-0000-4000-8000-000000000002",
    reviewer_id: "a0000000-0000-4000-8000-000000000001",
    reviewed_user_id: "a0000000-0000-4000-8000-000000000002",
    rating: 5,
    comment: "Nasi liwetnya enak banget, anter cepet.",
    created_at: "2025-09-01T18:00:00.000Z",
    reviewer: { id: "a0000000-0000-4000-8000-000000000001", name: "Budi Santoso", profile_photo_url: null },
  },
  {
    id: "e0000000-0000-4000-8000-000000000004",
    listing_id: "d0000000-0000-4000-8000-000000000004",
    reviewer_id: "a0000000-0000-4000-8000-000000000002",
    reviewed_user_id: "a0000000-0000-4000-8000-000000000003",
    rating: 4,
    comment: "Jaketnya oke, agak lama balas chat tapi barangnya sesuai.",
    created_at: "2025-07-20T09:00:00.000Z",
    reviewer: { id: "a0000000-0000-4000-8000-000000000002", name: "Siti Rahma", profile_photo_url: null },
  },
];

export function mockCategories(): Category[] {
  return CATEGORIES;
}

export function mockNearbyListings(): NearbyListing[] {
  return LISTINGS;
}

export function mockListingDetail(id: string) {
  const listing = LISTINGS.find((l) => l.id === id);
  if (!listing) return null;
  const category = CATEGORIES.find((c) => c.id === listing.category_id)!;
  return {
    id: listing.id,
    seller_id: listing.seller_id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category_id: listing.category_id,
    photos: listing.photos,
    lat: listing.lat,
    lng: listing.lng,
    status: listing.status,
    created_at: listing.created_at,
    category,
    seller: {
      id: listing.seller_id,
      name: listing.seller_name,
      profile_photo_url: null,
      city: "Kabupaten Karanganyar",
      identity_verified: listing.seller_is_verified,
      rating_avg: listing.seller_rating_avg,
    },
  };
}

export function mockProfile(id: string): PublicProfile | null {
  return PROFILES[id] ?? null;
}

export function mockListingsBySeller(sellerId: string): Listing[] {
  return LISTINGS.filter((l) => l.seller_id === sellerId).map((l) => ({
    id: l.id,
    seller_id: l.seller_id,
    title: l.title,
    description: l.description,
    price: l.price,
    category_id: l.category_id,
    photos: l.photos,
    lat: l.lat,
    lng: l.lng,
    status: l.status,
    created_at: l.created_at,
  }));
}

export function mockReviewsForUser(userId: string): MockReview[] {
  return REVIEWS.filter((r) => r.reviewed_user_id === userId);
}
