# Setup — My COD

Panduan menjalankan My COD dari nol: Supabase Cloud, migration, dan fitur
OTP WhatsApp (Baileys). Untuk peta struktur kode per fitur, lihat
[`alur.md`](./alur.md). Untuk audit sebelumnya (chat realtime, geocoding,
GPS-trust, verifikasi identitas), lihat riwayat commit — belum pernah
dijalankan/ditest end-to-end sampai panduan ini diikuti.

---

## 0. Prasyarat

- Node.js ≥ 20, pnpm ≥ 10 (`corepack enable` kalau belum ada pnpm).
- Akun [Supabase](https://supabase.com) (gratis cukup untuk mulai).
- **Satu nomor WhatsApp aktif khusus** untuk mengirim OTP (bukan nomor
  pribadi utama kamu — lihat §5, ada risiko kena banned kalau volume tinggi).
  Boleh nomor baru/kartu prabayar terpisah.

```bash
pnpm install
```

---

## 1. Buat project Supabase Cloud

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Setelah project jadi, buka **Settings → API**. Kamu butuh 3 nilai:
   - `Project URL` → jadi `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → jadi `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (klik "reveal") → jadi `SUPABASE_SERVICE_ROLE_KEY`
     (**rahasia — cuma untuk `apps/api/.env`, jangan pernah dipakai di sisi web/browser**)

---

## 2. Isi environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env`:

```bash
PORT=4000
WEB_ORIGIN=http://localhost:3000

SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=isi-dari-dashboard
SUPABASE_SERVICE_ROLE_KEY=isi-dari-dashboard

NOMINATIM_USER_AGENT=MyCOD/1.0 (contact: emailkamu@example.com)   # lihat §6

LOCATION_TRUST_MAX_IP_MISMATCH_KM=150     # opsional, default sudah oke
LOCATION_TRUST_MAX_SPEED_KMH=300          # opsional, default sudah oke

WHATSAPP_OTP_ENABLED=false                # ganti true di §5, jangan sekarang
```

Edit `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi-dari-dashboard   # anon key, BUKAN service_role

NEXT_PUBLIC_API_URL=                      # kosongkan — di-proxy ke port 4000 otomatis
NEXT_PUBLIC_USE_MOCK_DATA=false           # matikan sekarang, DB sudah nyata

NEXT_PUBLIC_DEFAULT_CITY_NAME=Kabupaten Karanganyar
NEXT_PUBLIC_DEFAULT_CITY_LAT=-7.601100
NEXT_PUBLIC_DEFAULT_CITY_LNG=110.943200
```

---

## 3. Terapkan database migration

Semua migration ada di `supabase/migrations/`, urutan nama file = urutan
eksekusi (jangan diacak). Cara paling gampang tanpa install Supabase CLI:
buka **SQL Editor** di dashboard Supabase, tempel isi tiap file secara
berurutan, jalankan satu-satu:

1. `20260725000001_init_schema.sql`
2. `20260725000002_rls_policies.sql`
3. `20260725000003_nearby_listings_rpc.sql`
4. `20260725000004_storage.sql`
5. `20260727000001_location_master_data.sql`
6. `20260925000001_transaction_flow_fix.sql`
7. `20260925000002_enable_realtime_chat.sql`
8. `20260925000003_location_trust.sql`
9. `20260925000004_identity_verification.sql`

Kalau punya [Supabase CLI](https://supabase.com/docs/guides/cli) terpasang,
lebih cepat pakai:

```bash
supabase link --project-ref xxxxxxxx   # ref ada di URL dashboard project kamu
supabase db push
```

Lalu isi data kategori + lokasi awal:

```sql
-- tempel isi supabase/seed.sql di SQL Editor (kategori contoh, districts/villages, dst.)
```

**Verifikasi:** buka **Table Editor** di dashboard, pastikan tabel
`profiles`, `listings`, `conversations`, `identity_verifications`,
`location_events`, dst. sudah muncul.

---

## 4. Jalankan aplikasi

```bash
pnpm dev
```

Ini menjalankan `apps/web` (http://localhost:3000) dan `apps/api`
(http://localhost:4000) sekaligus. Kalau mau lihat log masing-masing
terpisah, buka 2 terminal: `pnpm dev:web` dan `pnpm dev:api`.

Coba buka http://localhost:3000, register (email OTP — cek kotak masuk
email), lengkapi profil. Kalau ini sudah jalan, lanjut ke langkah admin.

---

## 5. Jadikan akunmu admin

Perlu buat bisa buka `/admin/verification` (setuju/tolak pengajuan KTP).
Tidak ada UI untuk ini — sengaja, biar tidak ada jalur self-serve jadi admin.

1. Daftar & login dulu lewat aplikasi (supaya baris `profiles` kamu ada).
2. Buka **Table Editor → profiles** di dashboard Supabase, cari baris
   dengan `id` = UUID akunmu (lihat kolom `id`, cocokkan dengan **Authentication → Users**), atau lewat SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<uuid-akunmu>';
   ```

---

## 6. Setup Baileys — supaya OTP WhatsApp bisa terkirim

Ini bagian yang paling beda dari setup Supabase biasa, jadi dijelaskan
detail.

### Apa itu Baileys, dan kenapa bukan Twilio/SMS

`apps/api/src/lib/whatsapp.ts` pakai
[`@whiskeysockets/baileys`](https://baileys.wiki) — library yang membuat
Node.js kamu **berperan sebagai WhatsApp Web** dari satu nomor WhatsApp
sungguhan, lalu mengirim pesan lewat sesi itu secara terprogram. Ini
**bukan** WhatsApp Business API resmi, dan **bukan** provider SMS yang
dicolok ke Supabase Auth (Supabase Auth phone-provider cuma terima
Twilio/Vonage/dll, tidak bisa langsung ke Baileys) — makanya OTP-nya
custom: kode dibuat & divalidasi sendiri oleh `apps/api`
(`verification.routes.ts`), WhatsApp cuma jadi jalur pengirimannya, dan ini
terpisah dari login (login tetap email-OTP).

**Risiko yang perlu kamu sadari** (bukan disembunyikan): dokumentasi
Baileys sendiri bilang mereka tidak mentolerir spam/bulk messaging, dan
nomor WhatsApp yang dipakai bisa **kena banned** oleh WhatsApp kalau
pola/volumenya dicurigai sebagai bot. Karena itu:
- **Jangan pakai nomor WhatsApp pribadi utamamu.** Pakai nomor
  terpisah/cadangan.
- Sistem ini sudah membatasi: 1 kode per 60 detik per nomor, kode
  kedaluwarsa 5 menit, maksimal 5 kali salah coba (`verification.routes.ts`)
  — tapi itu membatasi PENERIMA, bukan volume total nomor pengirimmu. Kalau
  nanti trafiknya besar, awasi dan pertimbangkan pindah ke provider SMS
  resmi.

### Langkah pairing (sekali saja)

1. Set di `apps/api/.env`:
   ```bash
   WHATSAPP_OTP_ENABLED=true
   ```
2. Jalankan API-nya (`pnpm dev:api` atau `pnpm dev`). Perhatikan log
   terminal — akan muncul QR code dalam bentuk ASCII art dengan pesan:
   ```
   [whatsapp] Scan QR ini sekali pakai HP nomor pengirim OTP:
   ```
3. Di HP yang jadi **nomor pengirim OTP**, buka WhatsApp → **Setelan →
   Perangkat Tertaut → Tautkan Perangkat** → scan QR di terminal.
4. Setelah berhasil, log akan menunjukkan:
   ```
   [whatsapp] Terhubung — siap kirim OTP via WhatsApp.
   ```
5. Sesi login tersimpan di folder `apps/api/.baileys-auth/` (dibuat
   otomatis, **sudah di-gitignore** — jangan pernah commit folder ini, isinya
   kredensial sesi WhatsApp asli). Selama folder ini ada, restart server
   tidak perlu scan ulang.

### Kalau sesi putus / perlu pairing ulang

Log akan menunjukkan `Sesi logged out`. Solusinya:
```bash
rm -rf apps/api/.baileys-auth
```
lalu restart API dan scan QR lagi dari awal (langkah 2-3 di atas).

### Uji coba

Buka http://localhost:3000/profile/verification, masukkan nomor HP-mu
sendiri (format bebas, mis. `08123456789` — dinormalisasi otomatis ke
`62...` sebelum dikirim), klik **Kirim Kode OTP**. Kode 6 digit akan masuk
lewat WhatsApp dari nomor yang tadi kamu pairing. Kalau tidak mau
mengaktifkan Baileys dulu, biarkan `WHATSAPP_OTP_ENABLED=false` — bagian
KTP/selfie di halaman yang sama tetap bisa dites tanpa OTP.

---

## 7. Geocoding (Nominatim) — opsional tapi gratis, tidak perlu akun

`NOMINATIM_USER_AGENT` di `apps/api/.env` cuma perlu diisi identitas
kontak nyata (kebijakan penggunaan Nominatim mewajibkan ini, bukan API
key). Tidak ada langkah pendaftaran. Kalau dibiarkan nilai default di
`.env.example`, tetap jalan tapi sebaiknya diganti ke kontak aslimu.

---

## 8. Checklist uji end-to-end manual

Setelah langkah 1-6 selesai, coba jalur penuh sekali dengan 2 akun
berbeda (buka 1 tab normal + 1 tab incognito, atau 2 browser):

- [ ] Register (email OTP) → lengkapi profil (nama, HP, alamat)
- [ ] Pasang 1 listing (cek foto ke-upload, titik lokasi lewat peta)
- [ ] Dari akun ke-2: buka listing itu → mulai chat
- [ ] Kirim pesan dari kedua akun bergantian **tanpa refresh** — pesan
      harus muncul realtime di tab lawan (kalau tidak, cek migration §3
      no. 7 sudah dijalankan)
- [ ] Atur jadwal COD dari panel chat, tandai **Selesai**
- [ ] Cek listing otomatis berubah status jadi **Terjual**
- [ ] Beri review/rating ke lawan transaksi
- [ ] Buka `/profile/verification`, verifikasi nomor HP (OTP WhatsApp
      masuk?), upload KTP + selfie
- [ ] Login sebagai admin, buka `/admin/verification`, lihat foto KTP/selfie
      (harus muncul, bukan gambar rusak — kalau rusak, cek bucket
      `identity-documents` sudah dibuat dari migration §3 no. 9), **Setujui**
- [ ] Kembali ke akun tadi, cek badge **Identitas Terverifikasi** muncul
      di profil publik & lencana di listing card

---

## 9. Troubleshooting singkat

| Gejala | Kemungkinan penyebab |
|---|---|
| API langsung crash saat start | `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` kosong di `apps/api/.env` — semuanya wajib diisi (`apps/api/src/config/env.ts`) |
| Halaman muter terus / data kosong | `NEXT_PUBLIC_USE_MOCK_DATA` masih `true`, atau `NEXT_PUBLIC_SUPABASE_URL` kosong |
| Chat tidak realtime (harus refresh manual) | Migration `20260925000002_enable_realtime_chat.sql` belum diterapkan |
| Upload foto gagal / 403 | Bucket Storage belum dibuat (migration §3 no. 4 dan no. 9) |
| `WHATSAPP_OTP_ENABLED=true` tapi OTP tidak pernah sampai | Sesi belum di-pairing (cek log ada `Sesi WhatsApp belum siap` di response error) — ulangi §6 |
| `pnpm install` menyebut "Ignored build scripts" | Aman diabaikan untuk `@whiskeysockets/baileys`/`protobufjs`; kalau Baileys error aneh, coba `pnpm approve-builds` |
| `/admin/verification` bilang "khusus admin" padahal sudah login | Kolom `profiles.role` akunmu belum `'admin'` — ulangi §5 |
