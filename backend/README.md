# Laju Jaya — Backend (Express.js + MongoDB)

## Menjalankan
```bash
npm install
cp .env.example .env      # isi MONGODB_URI & JWT_SECRET; FONNTE_TOKEN untuk kirim struk
npm run seed              # buat akun admin, budi, andi (mekanik), owner
npm run dev
```
Cek: `GET http://localhost:3000/health`

> Transaksi MongoDB (pencatatan suku cadang + pengurangan stok) **butuh replica set**.
> Termudah: MongoDB Atlas (free tier) dan tempel connection string-nya di `MONGODB_URI`.
> Lokal: jalankan `mongod --replSet rs0`, lalu sekali di mongosh: `rs.initiate()`.

## Realtime dengan Pusher Channels
Isi `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, dan `PUSHER_CLUSTER` dari aplikasi Pusher Channels. Isi `NEXT_PUBLIC_PUSHER_KEY` dan `NEXT_PUBLIC_PUSHER_CLUSTER` di frontend dengan key dan cluster yang sama. Jangan pernah mengirim `PUSHER_SECRET` ke frontend. Jika Pusher belum dikonfigurasi, halaman order tetap bekerja dengan polling berkala.

Pusher mengirim sinyal tanpa data order melalui private channel `private-orders`; klien staf yang terautentikasi akan mengambil ulang data melalui API. Backend mengirim sinyal setelah order dibuat atau diubah.

## Deploy backend ke Vercel
Buat project Vercel terpisah dari frontend ini, pilih folder `backend` sebagai **Root Directory**, dan biarkan framework terdeteksi sebagai Express. Vercel menggunakan export Express di `src/app.js`; jangan set `npm start` sebagai perintah produksi serverless. Tambahkan `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, serta variabel Pusher jika realtime diaktifkan. Untuk deployment frontend terpisah, set `NEXT_PUBLIC_API_URL` ke URL backend Vercel yang diakhiri `/api`.

Backend menghubungkan MongoDB pada request API dan menggunakan ulang koneksi selama instance serverless tetap hangat. Endpoint `GET /health` tersedia untuk pengecekan.

## Kirim struk melalui Fonnte
Isi `FONNTE_TOKEN` di `backend/.env` dengan token API dari perangkat Fonnte. Jangan commit file `.env` atau mengirim token ke frontend. Admin dapat mengirim struk dalam bentuk teks ke WhatsApp pelanggan saat order berstatus `Selesai`. PDF dapat dibuka dari halaman Cek Status dengan nomor antrean dan plat nomor setelah order berstatus `Selesai` atau `Diambil`. Respons sukses berarti Fonnte menerima permintaan untuk diproses, bukan konfirmasi bahwa pesan sudah diterima pelanggan. Paket gratis Fonnte dapat menambahkan branding `Sent via fonnte.com`.

## Kepemilikan file
| Area | Pemilik |
|---|---|
| `src/config`, `src/models`, `src/middleware`, `src/utils`, `src/routes`, `src/seeders`, `src/modules/auth` | Anggota 1 |
| `src/modules/customers`, `src/modules/orders` (kecuali `notify.routes.js`) | Anggota 2 |
| `src/modules/parts`, `src/modules/reports` | Anggota 3 |
| `src/modules/receipts`, `src/modules/tracking`, `src/modules/orders/notify.routes.js` | Anggota 4 |

Aturan: jangan edit file milik anggota lain. Butuh perubahan di model/middleware? Minta Anggota 1 lewat PR kecil.

## Alur git
Branch: `feature/<modul>`, merge ke `develop` lewat Pull Request. Commit: `<modul>: <apa yang dikerjakan>`
contoh `auth: tambah middleware authorize berbasis peran`.
