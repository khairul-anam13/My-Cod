# Alur & Struktur File — My COD

Peta struktur file per fitur dan alur datanya, dari halaman di browser sampai
tabel di database. Monorepo pnpm dengan 3 bagian:

```
apps/web              Next.js 16 (App Router) — frontend
apps/api              Express — REST API
packages/shared-types  Tipe TypeScript bersama (kontrak web <-> api)
supabase/              Schema Postgres (migrations) + seed data
```

Pola umum tiap fitur: **halaman/komponen (apps/web)** → `apiFetch()`
(`apps/web/src/lib/api.ts`) → **route Express** (`apps/api/src/routes/*`) →
**Supabase client** (RLS-aware) → **Postgres**. Tipe request/response di
kedua ujung berasal dari `packages/shared-types/src/index.ts`, satu-satunya
sumber kebenaran bentuk data.

---

## 0. Lapisan dasar (dipakai semua fitur)

| File | Peran |
|---|---|
| `apps/api/src/server.ts` | Bootstrap Express: helmet, cors, json body parser, lalu `attachSupabase`, lalu `/api` router, lalu 404 & error handler. |
| `apps/api/src/middleware/auth.ts` | `attachSupabase` (taruh Supabase client + `req.userId` dari Bearer token di tiap request) · `requireAuth` (401 kalau belum login) · `requireVerified` (403 kalau profil belum lengkap — ini yang jadi pengganti "verifikasi HP" di PRD). |
| `apps/api/src/lib/supabaseClient.ts` | `supabaseAdmin` (service role, bypass RLS) + client per-request yang menghormati RLS via JWT user. |
| `apps/api/src/config/env.ts` | Wajib ada `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — API langsung crash saat boot kalau kosong. |
| `apps/web/src/lib/api.ts` | `apiFetch()` — satu-satunya pintu ke API dari frontend. Juga tempat mock data (§9) disisipkan. |
| `apps/web/src/utils/supabase/{client,server,middleware}.ts` | Tiga titik pembuatan Supabase client di sisi web: browser, server component, dan Next middleware (refresh session tiap request). |
| `apps/web/src/middleware.ts` | Menjalankan `updateSession` di semua route kecuali file statis. |
| `packages/shared-types/src/index.ts` | Semua entity (`Profile`, `Listing`, `NearbyListing`, `Conversation`, `Message`, `CodMeetup`, `Review`, `Report`, `District`, `Village`, `UserAddress`, `Category`) + DTO request (`CreateListingInput`, dst). |

---

## 1. Auth & Sesi

**Alur:** login pakai email OTP (bukan password) lewat Supabase Auth langsung dari browser — tidak lewat Express API.

- `apps/web/src/app/login/page.tsx` — form kirim OTP (`supabase.auth.signInWithOtp`) → verifikasi kode (`supabase.auth.verifyOtp`). Ada juga akun demo (`DUMMY_USERS`) yang hanya muncul kalau `NEXT_PUBLIC_SUPABASE_URL` mengarah ke localhost.
- `apps/web/src/hooks/useSession.ts` — subscribe ke `supabase.auth.onAuthStateChange`, expose `session`/`user`/`accessToken`.
- `apps/web/src/hooks/useProfile.ts` — di atas `useSession`, fetch `GET /profiles/me/profile` pakai access token. `profile === null` berarti sudah login tapi belum onboarding.
- `apps/web/src/middleware.ts` + `utils/supabase/middleware.ts` — refresh token di server tiap request.
- Sisi API: `attachSupabase` decode Bearer token → `req.userId`; `requireVerified` cek kolom `profiles.is_verified`.

---

## 2. Beranda / Explore (feed jarak-terdekat)

- `apps/web/src/app/page.tsx` — halaman `/`. Dua layout berbeda (mobile native-app-style vs desktop e-commerce-grid) di file yang sama, di-switch lewat Tailwind `md:hidden` / `hidden md:block`.
- `apps/web/src/hooks/useLocation.ts` — GPS via `navigator.geolocation`, fallback ke koordinat kota default (`NEXT_PUBLIC_DEFAULT_CITY_LAT/LNG`).
- `apps/web/src/lib/listings.ts` — `fetchNearbyListings()` (bungkus `GET /listings/nearby`) + `diversifyFeed()` (acak urutan kategori di sisi klien biar feed tidak monoton).
- Komponen: `components/home/{HomeSearchBar,CategoryHighlights,RecommendedCard,LocationSignal}.tsx` (mobile) dan `components/ListingCard.tsx` (grid desktop).
- API: `GET /listings/nearby` (`apps/api/src/routes/listings.routes.ts:55`) — panggil RPC Postgres jarak-terdekat (`supabase/migrations/20260725000003_nearby_listings_rpc.sql`).

---

## 3. Pencarian (Search)

- `apps/web/src/app/search/page.tsx` — filter kategori/harga/radius, pakai `fetchNearbyListings()` yang sama dengan Beranda tapi dengan parameter filter terisi.
- `components/search/{FilterControls,MobileFilterFab}.tsx`, `components/layout/SearchBox.tsx` (search box di header desktop).
- API sama dengan §2: `GET /listings/nearby` menerima `category_id` / `min_price` / `max_price`.

---

## 4. Listing (lihat, pasang, edit, kelola)

| Halaman | File | Endpoint |
|---|---|---|
| Detail listing | `app/listing/[id]/page.tsx` (server component) + `ListingGallery.tsx`, `ListingActions.tsx` | `GET /listings/:id` |
| Pasang iklan baru | `app/post/page.tsx` + `post/NewListingForm.tsx` | `POST /listings` (butuh `requireAuth` + `requireVerified`) |
| Edit listing | `app/listing/[id]/edit/page.tsx` + `components/ListingForm.tsx` (dipakai bareng dengan form "pasang") | `PATCH /listings/:id` |
| Kelola listing sendiri | `app/profile/listings/page.tsx` | ubah status: `PATCH /listings/:id/status`, hapus: `DELETE /listings/:id` |

Semua route mutasi ada di `apps/api/src/routes/listings.routes.ts`. Form pasang/edit pakai `components/LocationPicker.tsx` + `LocationPickerMap.tsx` (Leaflet) untuk titik lokasi barang.

---

## 5. Kategori

- `apps/api/src/routes/categories.routes.ts` — `GET /categories`, hanya baca.
- `apps/web/src/lib/categoryIcons.tsx` — mapping string `icon` di DB (mis. `"Utensils"`) ke komponen `lucide-react`.
- Dipakai di Beranda (`CategoryHighlights`), Search (`FilterControls`), dan rail kategori desktop (`DesktopHeader.tsx`).

---

## 6. Lokasi / Alamat (district & village)

- `apps/api/src/routes/locations.routes.ts` — `GET /districts`, `GET /villages` (master data kecamatan/desa Karanganyar, dari `supabase/migrations/20260727000001_location_master_data.sql`).
- `apps/web/src/app/profile/edit/AddressFields.tsx` — dropdown kecamatan→desa + peta, dengan aturan **cooldown 30 hari** ganti alamat.
- Endpoint terkait: `GET/PUT /profiles/me/address` (`apps/api/src/routes/profiles.routes.ts:133,170`) — mengembalikan `can_update_now` / `next_update_allowed_at` yang dihitung server-side.

---

## 7. Chat & COD Meetup

- `apps/web/src/app/chat/page.tsx` — daftar percakapan (`GET /conversations`).
- `apps/web/src/app/chat/[id]/page.tsx` + `MeetupPanel.tsx`, `ListingPreviewCard.tsx`, `SafetyReminder.tsx`, `QuickReplies.tsx` — thread chat, polling pesan (`POLL_INTERVAL_MS`), dan panel jadwal COD.
- API (`apps/api/src/routes/conversations.routes.ts`):
  - `GET/POST /conversations`, `GET /conversations/:id`
  - `GET/POST /conversations/:id/messages`
  - `POST /conversations/:id/meetup`, `PATCH /conversations/:id/meetup/:meetupId` — jadwal & status ketemuan COD (`scheduled|completed|cancelled`).
  - Mulai chat & kirim pesan butuh `requireVerified` (bukan cuma login).

---

## 8. Profil, Trust Score & Review

| Bagian | File | Endpoint |
|---|---|---|
| Profil publik orang lain | `app/profile/[id]/page.tsx` + `ProfileHeader`, `ProfileTrustHero`, `TrustBadges`, `RecentFeedback`, `ProfileView`, `ChatFollowBar`, `ProfileActions` | `GET /profiles/:id` |
| Profil sendiri (redirect) | `app/profile/page.tsx` | `GET /profiles/me/profile` |
| Edit profil + alamat | `app/profile/edit/page.tsx` | `PUT /profiles/me/profile`, lihat §6 untuk alamat |
| Review | `components/RatingStars.tsx` | `GET /reviews/user/:userId`, `POST /reviews` (`requireAuth`) |
| Lapor pengguna/listing | `components/ReportDialog.tsx` | `POST /reports`, `GET /reports` (`apps/api/src/routes/reports.routes.ts`) |

`is_verified` + `rating_avg` di sini yang membentuk "trust score" yang tampil sebagai badge di `ListingCard`/`RecommendedCard`/`TrustBadges`.

---

## 9. Data dummy untuk cek visual (sementara)

Ditambahkan selama masa transisi ke Supabase Cloud (env belum diisi):

- `apps/web/src/lib/mockData.ts` — fixture kategori + 8 listing, mengikuti bentuk `supabase/seed.sql`.
- `apps/web/src/lib/api.ts` — kalau `NEXT_PUBLIC_USE_MOCK_DATA=true`, `GET /categories`, `GET /listings/nearby`, `GET /listings/:id` dijawab dari fixture, tidak menyentuh API/DB sama sekali. Fitur yang butuh login (chat, profil, posting) tidak di-mock.
- Matikan dengan set `NEXT_PUBLIC_USE_MOCK_DATA=false` di `apps/web/.env.local` setelah kredensial Supabase Cloud diisi.

---

## 10. Desain / UI shell

- `apps/web/src/app/globals.css` — token warna "Urban Neo-Brutalism" (Asphalt Black, Safety Orange, Electric Lime) + util `brutalist-shadow`, `hazard-edge`, `signal-ring`.
- `apps/web/src/components/layout/{BottomNav,PrimaryHeader,MobileHeader,DesktopHeader,AccountMenu,SearchBox}.tsx` — shell navigasi, beda total antara mobile (bottom nav + header per-tab) dan desktop (header sticky + rail kategori).
- `apps/web/DESIGN.md` — dokumen prinsip desain redesign terakhir (peran warna, aturan bulat-vs-kotak, elemen signature radar-ping).

---

## Referensi cepat: skema database

`supabase/migrations/` (urut waktu, ini "source of truth" schema):

1. `20260725000001_init_schema.sql` — tabel inti: profiles, categories, listings, conversations, messages, cod_meetups, reviews, reports.
2. `20260725000002_rls_policies.sql` — Row Level Security tiap tabel.
3. `20260725000003_nearby_listings_rpc.sql` — fungsi RPC jarak-terdekat dipakai §2/§3.
4. `20260725000004_storage.sql` — bucket Storage untuk foto listing/profil.
5. `20260727000001_location_master_data.sql` — tabel `districts`/`villages` + kolom alamat di `profiles`.

`supabase/seed.sql` — data contoh untuk dev lokal (akun demo, listing contoh) — juga jadi acuan bentuk data untuk `mockData.ts` (§9).
