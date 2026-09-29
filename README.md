# BengkelinAja

Sistem manajemen servis dan stok suku cadang untuk bengkel motor "Laju Jaya". Aplikasi ini
menggantikan pencatatan manual (buku antrean, catatan servis, stok suku cadang) dengan sistem
digital: status servis dapat dipantau, stok suku cadang berkurang otomatis saat dipakai dan
memberi peringatan saat menipis, serta pemilik bengkel bisa melihat laporan operasional.

Proyek Akhir mata kuliah Pengembangan Aplikasi Web (TIF213146), DTETI FT UGM.

## Anggota Kelompok

<!-- TODO: isi nama lengkap dan NIM tiap anggota -->
| Nama | NIM | Peran di Backend |
|---|---|---|
| _Muhammad Nabil Fitriansyah Boernama_ | _24/545232/TK/60628_ | fondasi, auth, model, middleware |
| _Zakhrova Salsabila_ | _24/534625/TK/59268_ | pelanggan & order |
| _Bintang Khalifa Hadianto_ | _24/534951/TK/59312_ | suku cadang & laporan |
| _Putri Tajudin_ | _24/545232/TK/60628_ | struk, notifikasi, publik |

## Struktur Folder dan File

```
laju-jaya-backend/
├── .env.example             
├── package.json
├── src/
│   ├── app.js                 # Setup Express (middleware global, mount routes)
│   ├── server.js              # Entry point: connect DB lalu jalankan server
│   ├── constants.js           # ROLES dan ORDER_STATUS (dipakai di seluruh app)
│   ├── config/
│   │   ├── env.js             # Baca & validasi environment variable
│   │   └── db.js              # Koneksi ke MongoDB
│   ├── middleware/
│   │   ├── auth.js            # authenticate (verifikasi JWT) & authorize (cek peran)
│   │   ├── validate.js        # Middleware validasi body/query/params dengan zod
│   │   └── errorHandler.js    # Error handler terpusat + handler 404
│   ├── models/                # Skema Mongoose: User, Customer, Order, OrderItem,
│   │                          # OrderStatusLog, Part, Counter (no antrean harian)
│   ├── modules/               # Satu folder per fitur; masing-masing berisi
│   │   ├── auth/              # <fitur>.routes.js, <fitur>.controller.js,
│   │   ├── customers/         # <fitur>.validation.js
│   │   ├── orders/            # (termasuk mechanics.routes.js, notify.routes.js)
│   │   ├── parts/
│   │   ├── receipts/
│   │   ├── reports/
│   │   └── tracking/
│   ├── routes/index.js        # Menggabungkan semua route modul ke /api
│   ├── seeders/seed.js        # Mengisi akun staf awal
│   └── utils/                 # AppError, asyncHandler, date (dateKey untuk no antrean)
```

## Teknologi yang Digunakan

| Package | Peran |
|---|---|
| `express` | HTTP server dan routing |
| `mongoose` | ODM MongoDB (schema + validasi) |
| `jsonwebtoken` | Autentikasi berbasis token (JWT) |
| `bcryptjs` | Hashing password |
| `zod` | Validasi dan sanitasi input |
| `cors` | Mengizinkan request lintas origin (untuk frontend) |
| `helmet` | Header keamanan HTTP dasar |
| `morgan` | Logging request saat development |
| `express-rate-limit` | Pembatas percobaan login dan endpoint publik (`/track`) |
| `pdfkit` | Membuat struk servis dalam bentuk PDF |
| `dotenv` | Memuat variabel `.env` |
| `nodemon` *(dev)* | Auto-restart saat development |

Database: **MongoDB** 

## Daftar Endpoint

Base URL: `http://localhost:3000/api`. Semua endpoint (kecuali login dan `/track`) butuh
header `Authorization: Bearer <token>`.

| Method | Endpoint | Deskripsi | Peran |
|---|---|---|---|
| POST | `/auth/login` | Login | Semua |
| POST | `/auth/logout` | Logout | Semua |
| GET | `/auth/me` | Data pengguna yang sedang login | Semua |
| GET | `/customers?q=` | Cari pelanggan (nama/no WhatsApp) | Admin, Mekanik, Owner |
| GET | `/customers/:id/orders` | Riwayat servis satu pelanggan | Admin, Mekanik, Owner |
| POST | `/orders` | Buat order servis baru | Admin |
| GET | `/orders?status=&plat=` | Daftar order | Admin, Mekanik, Owner |
| GET | `/orders/:id` | Detail order + total biaya | Admin, Mekanik, Owner |
| PATCH | `/orders/:id/status` | Ubah status order | Mekanik, Admin |
| PUT | `/orders/:id/service` | Catat suku cadang + biaya jasa | Admin |
| GET | `/mechanics/workload` | Jumlah order aktif tiap mekanik | Admin |
| GET | `/parts` | Daftar suku cadang + peringatan stok menipis | Admin, Owner |
| POST | `/parts` | Tambah jenis suku cadang baru | Admin |
| PATCH | `/parts/:id` | Ubah harga/stok/batas minimum | Admin |
| GET | `/reports/dashboard?period=` | Laporan operasional (daily/weekly/monthly) | Owner |
| GET | `/orders/:id/receipt` | Unduh struk servis (PDF) | Admin |
| GET | `/orders/:id/notify-link` | Tautan WhatsApp siap kirim ke pelanggan | Admin |
| GET | `/track?no_antrean=&plat=` | Cek status servis tanpa login | Publik |

## Laporan

Laporan PDF (analisis kebutuhan, analisis fitur, daftar API, hasil pemanggilan API via
Postman): <!-- TODO: tempel URL Google Drive di sini, pastikan izin akses "siapa saja yang
punya link" --> _(isi URL GDrive)_
