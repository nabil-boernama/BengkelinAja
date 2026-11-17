# BengkelinAja

Sistem manajemen servis dan stok suku cadang untuk bengkel motor "Laju Jaya". Aplikasi ini
mendigitalisasi pencatatan antrean dan servis, pemantauan status kendaraan, pengelolaan stok
suku cadang, serta laporan operasional bengkel.

Proyek Akhir mata kuliah Pengembangan Aplikasi Web (TIF213146), DTETI FT UGM.

---
##### [Link Web BengkelinAja](https://bengkel-laju-jaya.vercel.app)
##### [Link Video Presentasi & Demo](https://drive.google.com/file/d/1hm0QSPGVbGPBZODlVq2OjsBCJnTKv5Jl/view?usp=sharing)
##### [Folder Laporan BengkelinAja](https://drive.google.com/drive/folders/1BVq1ukSe8JshY3xhNFIL0UMRkIr1My79?usp=share_link)

---

## Anggota Kelompok

| Nama | NIM | Peran Backend | Peran Frontend |
|---|---|---|---|
| Muhammad Nabil Fitriansyah Boernama | 24/545232/TK/60628 | Fondasi, autentikasi, model, dan middleware | Order Baru (`/orders/new`), Riwayat Pelanggan (`/customers`), Detail Pelanggan (`/customers/[id]`) |
| Zakhrova Salsabila | 24/534625/TK/59268 | Pelanggan dan order | — |
| Bintang Khalifa Hadianto | 24/534951/TK/59312 | Suku cadang dan laporan | Landing page (`/`), Daftar Order (`/orders`), Detail Order (`/orders/[id]`) |
| Putri Tajudin (Puput) | 24/535824/TK/59469 | Struk, notifikasi, dan fitur publik | Halaman publik, Cek Status (`/cek-status`), Login (`/login`), halaman 403/404, Stok Suku Cadang (`/parts`), Dashboard Owner (`/dashboard`) |


## Struktur Folder

```text
BengkelinAja/
├── backend/                     # REST API, logika bisnis, autentikasi, dan akses database
│   └── src/
│       ├── config/              # Konfigurasi aplikasi dan koneksi database
│       ├── middleware/          # Autentikasi, otorisasi, validasi, dan penanganan error
│       ├── models/              # Model MongoDB untuk staf, pelanggan, order, dan suku cadang
│       ├── modules/
│       │   ├── auth/            # Login, logout, dan identitas pengguna
│       │   ├── customers/       # Pencarian pelanggan dan riwayat servis
│       │   ├── orders/          # Order, beban mekanik, dan notifikasi
│       │   ├── parts/           # Pengelolaan stok suku cadang
│       │   ├── realtime/        # Otorisasi event realtime Pusher
│       │   ├── receipts/        # Struk servis PDF dan pengiriman WhatsApp
│       │   ├── reports/         # Data dashboard dan laporan Owner
│       │   ├── staff/           # Pengelolaan akun staf
│       │   └── tracking/        # Pengecekan status servis publik
│       ├── routes/              # Penggabung route modul di prefix /api
│       ├── seeders/             # Data akun demo dan suku cadang contoh
│       └── utils/               # Fungsi bantu, error, format, tanggal, dan realtime
└── frontend/                    # Aplikasi web Next.js
    ├── public/                  # Logo, gambar layanan, dan aset publik
    └── src/
        ├── app/
        │   ├── (public)/        # Halaman publik: landing, cek status, dan login
        │   └── (staff)/         # Halaman staf: order, pelanggan, stok, dashboard, dan staf
        ├── components/          # Komponen antarmuka per fitur dan komponen bersama
        ├── context/             # State/context autentikasi pengguna
        ├── hooks/               # Hook polling, realtime, form, dan notifikasi
        ├── lib/                 # API client, akses/role, konstanta, dan utilitas
        └── services/            # Pemanggilan API untuk fitur frontend
```

## Teknologi yang Digunakan

| Teknologi | Penggunaan |
|---|---|
| Next.js App Router | Framework dan routing halaman frontend |
| React | Antarmuka pengguna |
| Leaflet + OpenStreetMap | Peta lokasi pada landing page |
| Pusher Channels (`pusher`, `pusher-js`) | Event realtime untuk perubahan order; polling menjadi fallback jika tidak dikonfigurasi |
| Express.js | REST API backend |
| MongoDB + Mongoose | Database dokumen dan pemodelan data |
| JSON Web Token (`jsonwebtoken`) | Autentikasi staf |
| `bcryptjs` | Hashing password |
| Zod | Validasi input API |
| `cors`, `helmet` | CORS dan HTTP security headers |
| `express-rate-limit` | Pembatasan request pada login dan endpoint publik |
| `morgan` | Logging request backend |
| PDFKit | Pembuatan struk servis PDF |
| Fonnte | Pengiriman pesan struk melalui WhatsApp (memerlukan token backend) |
| ESLint | Lint frontend |
| Vercel | Deployment frontend dan backend |

## Daftar Endpoints dan Routes

### Routes Frontend

Frontend memakai Next.js App Router.

| Route | Halaman | Akses |
|---|---|---|
| `/` | Landing page | Publik |
| `/cek-status` | Cek status servis | Publik |
| `/login` | Login staf | Publik |
| `/orders` | Daftar order | Admin, Mekanik, Owner |
| `/orders/new` | Form order baru | Admin |
| `/orders/[id]` | Detail order | Admin, Mekanik, Owner |
| `/customers` | Pencarian/riwayat pelanggan | Admin, Mekanik, Owner |
| `/customers/[id]` | Detail pelanggan dan riwayat servis | Admin, Mekanik, Owner |
| `/parts` | Stok dan pengelolaan suku cadang | Admin (kelola); Mekanik dan Owner (baca) |
| `/dashboard` | Dashboard laporan | Owner |
| `/staff` | Pengelolaan akun staf | Owner |
| URL yang tidak ditemukan | Halaman 404 | Publik |

Halaman 403 ditampilkan oleh `AuthGuard` saat pengguna terautentikasi tidak memiliki izin untuk
mengakses halaman.

### REST API Backend

Semua endpoint API kecuali login, `/track`, dan `/orders/receipt/lookup` memerlukan autentikasi sesuai role pada tabel.

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/health` | Pemeriksaan server | Publik |
| POST | `/auth/login` | Login staf | Publik |
| POST | `/auth/logout` | Logout | Staf terautentikasi |
| GET | `/auth/me` | Data pengguna yang sedang login | Staf terautentikasi |
| GET | `/customers?q=` | Cari pelanggan berdasarkan nama/nomor WhatsApp | Admin, Mekanik, Owner |
| GET | `/customers/plates?q=` | Cari plat nomor terdaftar | Admin, Mekanik, Owner |
| GET | `/customers/:id/orders` | Riwayat servis pelanggan | Admin, Mekanik, Owner |
| PATCH | `/customers/:id` | Ubah data pelanggan | Admin |
| POST | `/orders` | Buat order servis | Admin |
| GET | `/orders?status=&plat=&tanggal=&aktif=` | Daftar dan filter order | Admin, Mekanik, Owner |
| GET | `/orders/:id` | Detail order dan total biaya | Admin, Mekanik, Owner |
| PATCH | `/orders/:id` | Ubah detail order | Admin |
| PATCH | `/orders/:id/status` | Ubah status order | Admin, Mekanik |
| PUT | `/orders/:id/service` | Catat suku cadang dan biaya jasa | Admin |
| POST | `/orders/:id/cancel` | Batalkan order | Admin |
| POST | `/orders/:id/revert` | Kembalikan order Selesai ke Dikerjakan | Admin |
| GET | `/mechanics/workload` | Jumlah order aktif per mekanik | Admin |
| POST | `/realtime/auth` | Otorisasi private channel Pusher | Admin, Mekanik, Owner |
| GET | `/parts` | Daftar suku cadang dan peringatan stok | Admin, Mekanik, Owner |
| POST | `/parts` | Tambah suku cadang | Admin |
| PATCH | `/parts/:id` | Ubah suku cadang | Admin |
| DELETE | `/parts/:id` | Hapus suku cadang | Admin |
| GET | `/reports/dashboard?period=daily\|weekly\|monthly` | Laporan operasional | Owner |
| GET | `/staff` | Daftar akun staf | Owner |
| POST | `/staff` | Buat akun staf | Owner |
| PUT | `/staff/:id` | Ubah akun staf | Owner |
| PATCH | `/staff/:id/toggle-aktif` | Aktifkan/nonaktifkan akun | Owner |
| GET | `/orders/receipt/lookup?no_antrean=&plat=` | Cari dan tampilkan struk PDF | Publik; order Selesai/Diambil |
| GET | `/orders/:id/receipt` | Tampilkan struk PDF | Admin; order Selesai/Diambil |
| POST | `/orders/:id/receipt/send-whatsapp` | Kirim pesan struk melalui Fonnte | Admin; order Selesai |
| GET | `/orders/:id/notify-link` | Buat tautan WhatsApp untuk notifikasi status | Admin, Mekanik |
| GET | `/track?no_antrean=&plat=` | Cek status servis tanpa login | Publik |
