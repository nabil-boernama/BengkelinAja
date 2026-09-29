# Laju Jaya — Backend (Express.js + MongoDB)

## Menjalankan
```bash
npm install
cp .env.example .env      # isi MONGODB_URI & JWT_SECRET
npm run seed              # buat akun admin, budi, andi (mekanik), owner
npm run dev
```
Cek: `GET http://localhost:3000/health`

> Transaksi MongoDB (pencatatan suku cadang + pengurangan stok) **butuh replica set**.
> Termudah: MongoDB Atlas (free tier) dan tempel connection string-nya di `MONGODB_URI`.
> Lokal: jalankan `mongod --replSet rs0`, lalu sekali di mongosh: `rs.initiate()`.

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
