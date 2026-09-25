# Panduan Setup & Testing Lokal — My COD

Dokumen ini menjelaskan dari nol: cara menyiapkan Docker & Supabase CLI di komputer kamu, sampai cara meninjau (testing) seluruh alur aplikasi di mode development lokal.

Status di komputer ini saat dokumen ini dibuat:
- ✅ **Supabase CLI** sudah terpasang (`v2.109.1`, lewat scoop)
- ❌ **Docker Desktop** belum terpasang — ini yang perlu kamu instal manual dulu

---

## 1. Kenapa butuh Docker?

Supabase itu sebenarnya kumpulan beberapa service (database Postgres, server Auth, server Storage, dashboard Studio, dll). Saat kamu jalankan **Supabase lokal** (bukan pakai project cloud), Supabase CLI menjalankan semua service itu sebagai container Docker di komputer kamu sendiri — jadi kamu butuh Docker Desktop supaya container itu bisa jalan.

Tanpa Docker jalan, perintah `pnpm supabase:start` akan gagal dengan error semacam `Cannot connect to the Docker daemon`.

## 2. Instal Docker Desktop (Windows)

1. Download di **https://www.docker.com/products/docker-desktop/** (pilih versi Windows).
2. Jalankan installer-nya. Kalau muncul opsi **"Use WSL 2 instead of Hyper-V"**, biarkan tercentang (default) — ini yang direkomendasikan di Windows 11.
3. Kalau Windows minta instal/update **WSL2**, ikuti saja instruksinya. Biasanya perlu **restart komputer** setelah ini.
4. Setelah restart, buka aplikasi **Docker Desktop** dari Start Menu. Tunggu sampai ikon paus di system tray (pojok kanan bawah) berhenti animasi loading — artinya Docker sudah siap.
5. Docker Desktop harus **selalu dalam keadaan terbuka/jalan** setiap kali kamu mau menjalankan Supabase lokal. Kalau Docker Desktop kamu tutup, `supabase start` juga akan berhenti berfungsi.

### Cara cek Docker sudah siap

Buka terminal (PowerShell atau Git Bash), jalankan:

```bash
docker --version
docker ps
```

Kalau `docker ps` menampilkan tabel kosong (header saja: `CONTAINER ID   IMAGE   COMMAND ...`) tanpa error, berarti Docker sudah siap dipakai.

---

## 3. Instal Supabase CLI

Di komputer ini **sudah terpasang**, jadi bagian ini untuk referensi kalau kamu pindah komputer atau install ulang.

```bash
scoop install supabase
```

Kalau belum pakai [Scoop](https://scoop.sh/) (package manager Windows), alternatif lain:

```bash
# via npm (global)
npm install -g supabase

# atau via Chocolatey
choco install supabase
```

### Cara cek sudah terpasang

```bash
supabase --version
```

Harus menampilkan nomor versi (contoh: `2.109.1`), bukan error "command not found".

---

## 4. Menjalankan Supabase Secara Lokal

Setelah Docker Desktop jalan, dari root folder project (`x:\my-cod`):

```bash
pnpm supabase:start
```

**Yang terjadi di balik layar:**
- Supabase CLI men-download beberapa Docker image (Postgres, GoTrue/Auth, Storage API, Realtime, Kong API gateway, Studio, Inbucket). **Proses pertama kali bisa makan waktu beberapa menit** tergantung koneksi internet — ini normal, cuma sekali di awal saja.
- Semua migration SQL di `supabase/migrations/` otomatis dijalankan untuk membuat tabel `profiles`, `listings`, `categories`, `conversations`, `messages`, `cod_meetups`, `reviews`, `reports`, plus RLS policy dan fungsi pencarian jarak.
- `supabase/seed.sql` otomatis dijalankan, mengisi tabel `categories` dengan data awal (Elektronik, Furnitur, Fashion, dll).

Setelah selesai, akan muncul output seperti ini (nilai asli akan lebih panjang):

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Simpan/screenshot output ini** — kamu butuh `API URL`, `anon key`, dan `service_role key` di langkah berikutnya.

> Lupa catat? Tinggal jalankan `supabase status` kapan saja untuk menampilkan ulang info yang sama (asal Supabase masih jalan).

### Perintah terkait lainnya

| Perintah | Fungsi |
|---|---|
| `supabase status` | Tampilkan lagi URL & key tanpa restart |
| `pnpm supabase:stop` | Matikan semua container Supabase lokal |
| `pnpm supabase:reset` | **Hapus semua data**, lalu jalankan ulang semua migration + seed dari awal (berguna kalau data testing sudah berantakan) |

### Studio — dashboard visual untuk lihat data

Buka **http://127.0.0.1:54323** di browser. Ini dashboard mirip Supabase cloud, tapi untuk database lokal kamu. Berguna banget untuk:
- Lihat isi tabel langsung (menu **Table Editor**)
- Lihat user yang sudah login (menu **Authentication**)
- Jalankan query manual (menu **SQL Editor**)

---

## 5. Konfigurasi File Environment (`.env`)

Ada 2 file yang perlu diisi, masing-masing untuk app Express dan app Next.js.

### 5.1 `apps/api/.env`

```bash
cp apps/api/.env.example apps/api/.env
```

Isi filenya (`apps/api/.env`):

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<tempel anon key dari langkah 4>
SUPABASE_SERVICE_ROLE_KEY=<tempel service_role key dari langkah 4>
```

### 5.2 `apps/web/.env.local`

```bash
cp apps/web/.env.example apps/web/.env.local
```

Isi filenya (`apps/web/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tempel anon key yang sama dari langkah 4>

NEXT_PUBLIC_API_URL=http://localhost:4000

NEXT_PUBLIC_DEFAULT_CITY_NAME=Kota Anda
NEXT_PUBLIC_DEFAULT_CITY_LAT=-6.200000
NEXT_PUBLIC_DEFAULT_CITY_LNG=106.816666
```

> **Penting:** `SUPABASE_ANON_KEY` (di api) dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (di web) harus diisi nilai **anon key** yang sama persis. `SUPABASE_SERVICE_ROLE_KEY` cuma dipakai backend (Express), jangan pernah ditaruh di file `apps/web/` karena itu akan ter-expose ke browser.

Kalau di komputer ini file-nya sudah ada berisi nilai `preview-placeholder-not-a-real-key` (dipakai untuk sekadar preview tampilan tanpa Supabase menyala) — **ganti dulu** dengan anon key asli dari `supabase status` sebelum testing fitur yang butuh data sungguhan (login, posting, chat, dll).

---

## 6. Install Dependencies & Jalankan Aplikasi

Kalau belum pernah install sebelumnya:

```bash
pnpm install
```

Jalankan web + api sekaligus:

```bash
pnpm dev
```

Atau satu-satu di terminal terpisah kalau mau lihat log masing-masing lebih jelas:

```bash
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

### Cek semuanya nyala

```bash
curl http://localhost:4000/health      # harus balas {"status":"ok"}
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000   # harus 200
```

Kalau semua di atas (Docker → Supabase → `.env` → `pnpm dev`) sudah jalan, sekarang kamu punya 4 hal aktif:

| Layanan | URL |
|---|---|
| Web app (Next.js) | http://localhost:3000 |
| API (Express) | http://localhost:4000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Inbucket (kotak masuk email dev) | http://127.0.0.1:54324 |

---

## 7. Meninjau Alur Lengkap di Browser

Ikuti urutan ini supaya kamu menguji semua fitur utama sesuai PRD.

### Langkah 1 — Beranda & lokasi
Buka http://localhost:3000. Browser akan minta izin lokasi.
- **Izinkan** → beranda akan mencoba mengambil listing di sekitar koordinat asli kamu.
- **Tolak** → beranda otomatis pakai lokasi default (`NEXT_PUBLIC_DEFAULT_CITY_LAT/LNG` di `.env.local`) — ini yang membuktikan fallback lokasi di PRD §4.1 jalan.

Karena database masih kosong, kamu akan lihat pesan "Belum ada barang di sekitar sini" — itu normal, belum ada listing.

### Langkah 2 — Login (akun pertama, sebagai "Penjual")
Tekan tab **Profil** di bawah → diarahkan ke halaman login.
- Nomor HP: `+6281111111111`
- Kode OTP: `123456`

(Nomor & kode ini adalah kredensial uji tetap yang sudah dikonfigurasi di `supabase/config.toml` bagian `[auth.sms.test_otp]` — jadi tidak butuh SMS asli sama sekali saat dev lokal.)

### Langkah 3 — Lengkapi profil
Setelah OTP berhasil, otomatis diarahkan ke **Lengkapi Profil**. Isi nama & kota, simpan. Ini membuat baris baru di tabel `profiles` (bisa dicek di Supabase Studio → Table Editor → `profiles`).

### Langkah 4 — Posting barang
Tekan tombol **+ (Jual)** di navigasi bawah. Isi form:
- Upload minimal 1 foto (foto ini diunggah ke Supabase Storage bucket `listing-photos`)
- Judul, harga, kategori, deskripsi
- Tekan **Publikasikan**

Kamu akan diarahkan ke halaman detail barang yang baru dibuat.

### Langkah 5 — Cek muncul di beranda
Balik ke tab **Beranda** — barang tadi harus muncul (karena lokasinya dekat dengan lokasi kamu sendiri).

### Langkah 6 — Buat akun kedua (sebagai "Pembeli")
Kamu **tidak bisa chat dengan listing milik sendiri** (tombol "Chat Penjual" sengaja disembunyikan untuk pemilik listing). Untuk menguji alur chat/COD/rating secara penuh, kamu butuh akun kedua.

**Aplikasi ini belum punya tombol logout**, jadi cara termudah adalah buka akun kedua di **jendela browser terpisah** (mode Incognito/Private, atau browser lain) — supaya sesi login-nya tidak bentrok dengan akun pertama.

Tambahkan nomor uji kedua dulu di `supabase/config.toml`:

```toml
[auth.sms.test_otp]
"+6281111111111" = "123456"
"+6281111111112" = "123456"
```

Karena ini mengubah konfigurasi, Supabase perlu di-restart supaya perubahan kebaca:

```bash
pnpm supabase:stop
pnpm supabase:start
```

> `supabase:stop` lalu `supabase:start` **tidak menghapus data** kamu (beda dengan `supabase:reset`), jadi listing & profil yang sudah dibuat tadi tetap ada.

Di jendela Incognito, buka http://localhost:3000, login pakai `+6281111111112` / `123456`, lengkapi profil (pakai nama berbeda, misal "Pembeli Uji").

### Langkah 7 — Chat
Dari akun kedua, buka listing yang dibuat akun pertama tadi, tekan **Chat Penjual**. Kirim beberapa pesan — cek juga apakah pesan baru muncul di jendela akun pertama (chat pakai polling tiap 4 detik, jadi tunggu sebentar, bukan realtime instan).

### Langkah 8 — Atur jadwal COD
Di halaman chat, tekan **Atur COD** → isi titik ketemu & waktu → **Simpan Jadwal**. Cek muncul di kedua sisi (pembeli & penjual).

### Langkah 9 — Tandai selesai & beri rating
Tekan **Tandai Selesai** pada jadwal COD tadi → form rating (bintang + komentar opsional) langsung muncul → kirim ulasan. Cek `profiles.rating_avg` milik penjual ikut ter-update (bisa dicek di Studio, atau di halaman profil publik penjual di web).

### Langkah 10 — Coba fitur laporkan
Buka listing atau profil pengguna manapun → tekan **Laporkan** → pilih alasan → kirim. Cek masuk ke tabel `reports` di Studio (kolom `status` akan `pending`).

### Langkah 11 — Verifikasi lewat Supabase Studio
Buka http://127.0.0.1:54323 → **Table Editor**, cek satu-satu tabel berikut sudah terisi sesuai langkah di atas:

| Tabel | Berisi apa |
|---|---|
| `profiles` | 2 baris (penjual & pembeli uji) |
| `listings` | 1 barang yang diposting |
| `conversations` | 1 percakapan antara 2 akun |
| `messages` | pesan-pesan chat |
| `cod_meetups` | jadwal COD, status `completed` |
| `reviews` | 1 ulasan |
| `reports` | 1 laporan, status `pending` |

Kalau semua tabel di atas terisi sesuai yang kamu lakukan, artinya seluruh alur end-to-end sudah berfungsi dengan benar.

---

## 8. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `Cannot connect to the Docker daemon` saat `pnpm supabase:start` | Docker Desktop belum dibuka / belum selesai loading. Buka aplikasinya, tunggu ikon paus di tray berhenti animasi, coba lagi. |
| `supabaseKey is required` saat buka web app | `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `apps/web/.env.local` kosong atau masih `preview-placeholder-...`. Isi dengan anon key asli dari `supabase status`, lalu restart `pnpm dev:web`. |
| Login OTP gagal terus / "Kode OTP salah" | Pastikan nomor & kode persis sama dengan yang ada di `[auth.sms.test_otp]` pada `supabase/config.toml`, termasuk format `+62...`. Kalau baru mengubah `config.toml`, jangan lupa `supabase:stop` lalu `supabase:start` ulang. |
| `Another next dev server is already running` | Sudah ada proses `next dev` lain jalan di background (kadang tersisa dari sesi sebelumnya). Pesan errornya menyebutkan PID — matikan dengan `taskkill /PID <angka> /F`, lalu jalankan `pnpm dev` lagi. |
| Port `3000`/`4000`/`54321` dst sudah dipakai aplikasi lain | Next akan otomatis pindah ke port lain (`3001`, dst) dan memberitahu di log. Untuk Supabase, ganti nomor port di `supabase/config.toml` lalu `supabase:stop` + `supabase:start`. |
| Foto tidak muncul setelah upload | Cek bucket `listing-photos`/`profile-photos` benar-benar ada — harusnya otomatis dibuat oleh migration `20260725000004_storage.sql`. Kalau habis `supabase:reset` foto lama hilang (karena storage lokal ikut ke-reset), itu normal, upload ulang saja. |
| Halaman kosong/putih tanpa error jelas | Buka Developer Tools browser (F12) → tab **Console**, biasanya ada pesan error yang lebih spesifik dari sana. |

---

## 9. Ringkasan Perintah (cheat sheet)

```bash
# Sekali di awal / setelah clone
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# → isi kedua .env dengan anon key & service_role key dari langkah berikut:

# Setiap mau mulai kerja/testing
pnpm supabase:start     # pastikan Docker Desktop sudah jalan duluan
pnpm dev                # jalankan web (3000) + api (4000)

# Selesai kerja
pnpm supabase:stop

# Kalau data testing mau dibersihkan total
pnpm supabase:reset
```
