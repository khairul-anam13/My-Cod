# PRD — Project Requirements Document
## My COD (nama sementara — bisa diganti sesuai selera)
### Marketplace Komunitas Berbasis COD untuk Satu Kota

---

## 1. Overview

### 1.1 Latar Belakang Masalah
Jual-beli barang bekas/preloved di tingkat kota saat ini didominasi oleh Facebook Marketplace, yang punya beberapa masalah nyata:
- Tidak ada filter jarak/lokasi yang akurat — hasil pencarian sering keluar dari kota lain.
- Tidak ada sistem kepercayaan (trust) yang jelas antar pengguna — rawan penipuan, PHP (php: janji tapi gak jadi), atau barang tidak sesuai.
- Tidak dirancang khusus untuk transaksi COD (Cash on Delivery/ketemu langsung).
- Komunitas tercampur dengan seluruh pengguna Facebook, bukan komunitas warga kota yang sama.

### 1.2 Solusi
Aplikasi marketplace mobile yang **dikunci ke satu kota**, dirancang khusus untuk transaksi COD antar warga lokal, dengan pencarian berbasis lokasi sebagai fitur utama dan sistem kepercayaan (verifikasi, rating, laporan) untuk menggantikan rasa aman yang tidak didapat di Facebook Marketplace.

### 1.3 Target Pengguna (Primary Persona)
- Pekerja kantoran, mayoritas pria, usia 18–40 tahun.
- Tinggal/beraktivitas di satu kota yang sama.
- Terbiasa transaksi COD, mencari barang bekas/preloved di sekitar lokasinya (rumah/kantor).
- Butuh rasa aman dan efisiensi waktu — tidak mau chat berjam-jam dengan penjual yang ternyata jauh atau tidak jelas.

### 1.4 Value Proposition
| Facebook Marketplace | My COD |
|---|---|
| Pencarian lokasi tidak akurat | Pencarian berbasis radius/jarak terdekat |
| Tidak ada verifikasi identitas | Verifikasi nomor HP (+opsional KTP) |
| Tidak ada rating pasca-transaksi | Rating & review wajib setelah COD |
| Komunitas campur seluruh dunia | Komunitas warga satu kota saja |
| Tidak dirancang untuk COD | Alur COD (jadwal & titik ketemu) built-in |

### 1.5 Mengapa Pengguna Akan Kembali (Retensi)
Rasa memiliki terhadap **komunitas warga lokal** — pengguna kembali karena tahu mereka bertransaksi dengan tetangga/warga sekota yang bisa dinilai reputasinya, bukan orang asing dari mana saja.

---

## 2. Requirements

### 2.1 Functional Requirements
- Pengguna dapat mendaftar & login menggunakan nomor HP (OTP).
- Pengguna dapat mengatur lokasi (kota + titik koordinat perkiraan).
- Pengguna dapat memposting barang jual (foto, judul, harga, deskripsi, kategori, lokasi).
- Pengguna dapat mencari & memfilter barang berdasarkan **jarak terdekat**, kategori, dan harga.
- Pengguna dapat chat dengan penjual/pembeli di dalam aplikasi.
- Pengguna dapat menyepakati jadwal & titik temu COD di dalam alur chat.
- Pengguna dapat memberi rating & ulasan setelah transaksi selesai.
- Pengguna dapat melaporkan (report) pengguna/listing yang mencurigakan.
- Pengguna menerima notifikasi saat ada barang baru di sekitar lokasinya.

### 2.2 Non-Functional Requirements
- **Performa**: hasil pencarian lokasi harus tampil < 2 detik untuk radius standar.
- **Skala awal**: dirancang untuk 1 kota (puluhan ribu pengguna), bukan skala nasional dulu.
- **Keamanan**: nomor HP terverifikasi wajib sebelum bisa posting barang.
- **Privasi lokasi**: lokasi pengguna lain tidak pernah ditampilkan sebagai alamat persis, hanya radius/perkiraan jarak.
- **Ketersediaan**: uptime backend minimal 99% (untuk MVP masih acceptable manual monitoring).
- **Bahasa**: UI berbahasa Indonesia.
- **Koneksi**: dioptimalkan untuk jaringan mobile data yang tidak selalu stabil (gambar terkompresi, lazy load).

### 2.3 Out of Scope (MVP)
- Pembayaran online/dompet digital in-app (fokus murni COD dulu).
- Ekspansi multi-kota.
- Pengiriman via kurir/ekspedisi.

---

## 3. Core Features

Diurutkan berdasarkan prioritas terhadap kebutuhan inti pengguna:

### 3.1 Prioritas Utama (Must-Have MVP)
1. **Pencarian & Filter Berdasarkan Lokasi** — fitur paling penting; radius jarak dari posisi pengguna, urut dari terdekat.
2. **Posting & Kelola Listing** — upload foto, harga, deskripsi, kategori, titik lokasi umum.
3. **Verifikasi Nomor HP** — syarat dasar untuk membangun trust.
4. **Chat In-App** — negosiasi & koordinasi tanpa keluar aplikasi (mengurangi kebutuhan tukar nomor HP di awal).
5. **Alur Kesepakatan COD** — set jadwal + titik temu (idealnya tempat umum yang aman) langsung dari chat.
6. **Rating & Review Pasca-Transaksi** — inti dari "lebih terpercaya" dan retensi komunitas.
7. **Laporan Pengguna/Listing (Report & Block)** — menjaga kualitas komunitas.

### 3.2 Prioritas Kedua (Nice-to-Have setelah MVP)
- Notifikasi barang baru sesuai radius/kategori favorit.
- Badge/label "Warga Terverifikasi" atau "Penjual Terpercaya" (berdasarkan histori rating).
- Wishlist/simpan barang.
- Kategori & pencarian dengan kata kunci.

---

## 4. User Flow

### 4.1 First-Time Open (Kritis — harus langsung bisa cari barang terdekat)
```
Buka App
  → Izinkan akses lokasi (atau pilih kota/area manual jika ditolak)
  → Langsung tampil Home: daftar barang terdekat berdasarkan radius
  → (Login/daftar baru diminta saat user mau chat/posting, bukan di awal)
```

### 4.2 Flow Pencarian & Beli
```
Home (barang terdekat)
  → Filter (kategori / jarak / harga) [opsional]
  → Buka detail listing (foto, harga, jarak, profil penjual + rating)
  → Chat penjual
  → Nego harga & sepakati titik + jadwal COD
  → Transaksi COD di lokasi
  → Beri rating & ulasan ke penjual
```

### 4.3 Flow Jual (Posting Barang)
```
Tap "Jual Barang"
  → Login/verifikasi HP jika belum
  → Upload foto barang
  → Isi judul, harga, deskripsi, kategori
  → Konfirmasi lokasi (area umum, bukan alamat persis)
  → Publish listing → muncul di pencarian terdekat pembeli sekitar
```

### 4.4 Flow Laporan
```
Buka profil/listing mencurigakan
  → Tap "Laporkan"
  → Pilih alasan (penipuan, barang tidak sesuai, tidak muncul saat COD, dll)
  → Kirim laporan → tim moderasi meninjau
```

---

## 5. Architecture

### 5.1 Pendekatan
Mobile-first (rekomendasi: aplikasi native/cross-platform, misal React Native atau Flutter), karena target pengguna mengakses dari HP saat mobile dan butuh akses lokasi real-time.

### 5.2 Komponen Utama
```
[Mobile App (React Native/Flutter)]
        |
        v
[API Gateway / Backend REST API (Node.js/Express atau NestJS)]
        |
   -----------------------------------------------
   |            |            |          |         |
[Auth/OTP]  [Listing    [Chat/       [Geolocation [Notification
 Service]    Service]    Messaging     Search      Service (Push)]
                          Service]     Service]
        |
        v
[Database: PostgreSQL + PostGIS (untuk query jarak/radius)]
        |
[Object Storage untuk foto barang (S3-compatible, mis. Cloudflare R2/MinIO)]
```

### 5.3 Catatan Teknis Kunci
- **Geolocation search**: gunakan PostgreSQL dengan ekstensi **PostGIS** agar query "barang dalam radius X km dari titik user" efisien.
- **Chat**: bisa mulai dari REST polling sederhana untuk MVP, upgrade ke WebSocket (mis. Socket.IO) saat traffic naik.
- **Auth**: OTP via SMS (gunakan provider lokal Indonesia untuk biaya SMS lebih murah dan deliverability lebih baik).
- **Image handling**: kompres & resize otomatis saat upload untuk menghemat data pengguna.
- **Notifikasi**: push notification (Firebase Cloud Messaging) untuk barang baru di sekitar lokasi tersimpan user.

---

## 6. Database Schema

### 6.1 `users`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| phone_number | string, unique | terverifikasi via OTP |
| name | string | |
| profile_photo_url | string | |
| city | string | dikunci ke 1 kota untuk MVP |
| lat, lng | float | lokasi umum/area, bukan alamat persis |
| is_verified | boolean | verifikasi HP/KTP |
| rating_avg | float | dihitung dari reviews |
| created_at | timestamp | |

### 6.2 `listings`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| seller_id | UUID (FK → users) | |
| title | string | |
| description | text | |
| price | integer | |
| category_id | UUID (FK → categories) | |
| photos | array/json | URL foto |
| lat, lng | float | lokasi barang (area umum) |
| status | enum | available, reserved, sold |
| created_at | timestamp | |

### 6.3 `categories`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| icon | string | |

### 6.4 `conversations` & `messages`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | conversations |
| listing_id | UUID (FK) | |
| buyer_id, seller_id | UUID (FK → users) | |
| created_at | timestamp | |

| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | messages |
| conversation_id | UUID (FK) | |
| sender_id | UUID (FK → users) | |
| content | text | |
| sent_at | timestamp | |

### 6.5 `cod_meetups`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| conversation_id | UUID (FK) | |
| meetup_location | string | idealnya titik umum/aman |
| meetup_time | timestamp | |
| status | enum | scheduled, completed, cancelled |

### 6.6 `reviews`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| listing_id | UUID (FK) | |
| reviewer_id, reviewed_user_id | UUID (FK → users) | |
| rating | integer (1–5) | |
| comment | text | |
| created_at | timestamp | |

### 6.7 `reports`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| reporter_id | UUID (FK → users) | |
| reported_user_id / reported_listing_id | UUID | |
| reason | enum | penipuan, barang tidak sesuai, no-show, lainnya |
| status | enum | pending, reviewed, resolved |
| created_at | timestamp | |

---

## 7. Design & Technical Constraints

### 7.1 Batasan Cakupan
- **Terkunci ke 1 kota** — semua listing & pencarian dibatasi ke kota yang sama untuk menjaga relevansi komunitas. Ekspansi kota lain baru dipikirkan setelah MVP tervalidasi.

### 7.2 Trust & Safety
- Verifikasi nomor HP wajib sebelum posting/chat.
- Lokasi yang ditampilkan ke pengguna lain selalu berupa **area umum/perkiraan jarak**, bukan alamat rumah persis — demi keamanan.
- Titik temu COD disarankan di tempat umum (kantor, mall, minimarket), bukan rumah pribadi.
- Sistem rating wajib muncul setelah status transaksi ditandai selesai.
- Fitur report harus mudah diakses dari listing maupun profil pengguna.

### 7.3 Desain UI/UX
- Mobile-first, satu tangan (thumb-friendly), karena target user membuka aplikasi sambil mobile/di sela kerja kantoran.
- Home screen = daftar barang terdekat, tanpa langkah tambahan (sesuai insight: "begitu buka app, harus bisa langsung cari barang terdekat").
- Bahasa Indonesia, nada santai tapi tetap profesional (sesuai gaya komunikasi target user pekerja kantoran).

### 7.4 Batasan Teknis
- Optimasi untuk koneksi mobile data yang naik-turun (kompresi gambar, skeleton loading, retry otomatis).
- Query pencarian lokasi harus tetap cepat walau data listing bertambah — gunakan indexing spasial (PostGIS GiST index) sejak awal, jangan ditunda.
- Karena MVP berskala 1 kota, arsitektur boleh sederhana (monolith backend) — hindari over-engineering microservices di tahap awal.

---

*Dokumen ini adalah starting point untuk proses development (vibe coding). Nama aplikasi, warna brand, dan detail UI masih bisa disesuaikan sesuai preferensi.*
