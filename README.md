# My COD

Marketplace komunitas berbasis COD untuk satu kota. Lihat [PRD-marketplace-cod-lokal.md](./PRD-marketplace-cod-lokal.md) untuk latar belakang produk lengkap.

Monorepo pnpm dengan tiga bagian:

```
apps/web     Next.js 16 (App Router) — web app mobile-first untuk pembeli/penjual
apps/api     Express — REST API gateway di depan Supabase (autorisasi via RLS)
packages/shared-types  Tipe TypeScript yang dipakai bareng web & api
supabase/    Skema database, RLS policy, RPC pencarian jarak, storage — via Supabase CLI
```

## Kenapa arsitekturnya begini

- **Supabase Auth (OTP HP)** menangani identitas & verifikasi nomor HP secara langsung dari browser (`apps/web`) — tidak lewat Express.
- **Express (`apps/api`)** adalah REST gateway yang membungkus logika bisnis (posting barang, chat, jadwal COD, rating, laporan). Setiap request diteruskan ke Supabase memakai *token JWT milik user itu sendiri* (lihat `apps/api/src/lib/supabaseClient.ts`), sehingga Row Level Security di Postgres yang menegakkan otorisasi — bukan kode Express.
- **PostGIS** dipakai untuk query "barang dalam radius X km", diekspos lewat RPC `nearby_listings` (`supabase/migrations/..._nearby_listings_rpc.sql`) dan dipanggil dari `GET /api/listings/nearby`.
- **Chat** memakai REST polling sederhana (sesuai catatan PRD §5.3) — lihat `apps/web/src/app/chat/[id]/page.tsx`. Bisa diupgrade ke WebSocket/Supabase Realtime kalau traffic naik.

## Prasyarat

- Node.js ≥ 20, pnpm ≥ 10 (`corepack enable` biasanya sudah cukup)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — dibutuhkan Supabase CLI untuk menjalankan Postgres lokal
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) — `npm install -g supabase` (atau `scoop install supabase` di Windows)

## Setup

```bash
pnpm install

# 1) Jalankan Supabase lokal (Postgres + Auth + Storage + Studio)
pnpm supabase:start
# Catat "API URL", "anon key", dan "service_role key" dari output di atas.

# 2) Isi environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# lalu isi SUPABASE_URL / *_ANON_KEY / *_SERVICE_ROLE_KEY sesuai output `supabase status`

# 3) Jalankan web + api bersamaan
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check: `GET /health`)
- Supabase Studio (lokal): http://localhost:54323

Login pakai OTP butuh provider SMS asli untuk nomor sungguhan. Untuk dev lokal, `supabase/config.toml` sudah mengisi nomor uji `+6281111111111` dengan kode tetap `123456` (lihat `[auth.sms.test_otp]`) — pakai nomor itu saat login di localhost.

## Perintah lain

| Perintah | Keterangan |
|---|---|
| `pnpm dev:web` / `pnpm dev:api` | Jalankan satu app saja |
| `pnpm build` | Build semua app (`tsc` untuk api, `next build` untuk web) |
| `pnpm typecheck` | `tsc --noEmit` di semua workspace |
| `pnpm lint` | ESLint di `apps/web` dan `apps/api` |
| `pnpm supabase:reset` | Reset DB lokal & jalankan ulang semua migration + `supabase/seed.sql` |
| `pnpm supabase:stop` | Matikan container Supabase lokal |

## Struktur data

Skema database ada di `supabase/migrations/`, urut sesuai timestamp:

1. `..._init_schema.sql` — tabel `profiles`, `categories`, `listings`, `conversations`, `messages`, `cod_meetups`, `reviews`, `reports` (mengikuti PRD §6), plus trigger yang menjaga `profiles.rating_avg` tetap sinkron dengan `reviews`.
2. `..._rls_policies.sql` — Row Level Security: barang & profil publik untuk dibaca, posting butuh HP terverifikasi, chat/jadwal COD hanya untuk peserta percakapan (PRD §7.2).
3. `..._nearby_listings_rpc.sql` — fungsi `nearby_listings()` pakai index GiST + `ST_DWithin` untuk pencarian radius yang cepat (PRD §7.4).
4. `..._storage.sql` — bucket `listing-photos` & `profile-photos` beserta policy upload.

## Status implementasi vs. PRD

Semua **must-have MVP** di PRD §3.1 sudah ada alurnya end-to-end (pencarian lokasi, posting, verifikasi HP, chat, jadwal COD, rating, report). Yang belum digarap dan cocok untuk iterasi berikutnya:

- Notifikasi barang baru (push/FCM) — §3.2, nice-to-have.
- Badge "Penjual Terpercaya", wishlist, keyword search — §3.2, nice-to-have.
- Kompresi gambar otomatis saat upload (saat ini foto diunggah apa adanya ke Supabase Storage).
- Dashboard moderasi untuk antrean `reports` (saat ini hanya bisa dibaca lewat service-role key / Supabase Studio).
