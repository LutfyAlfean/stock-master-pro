# Toko MF — Sistem Manajemen Stok (Next.js + Prisma + Postgres + Docker)

Versi self-host (Next.js 14 App Router + Prisma + Postgres) berjalan di **port 3103**.

## Jalankan dengan Docker (1 perintah)

```bash
cd docker-app
docker compose up --build
```

Tunggu hingga log menampilkan `ready - started server on 0.0.0.0:3103`.

Buka: <http://localhost:3103>

Login default:
- **Username:** `admin_pemilik`
- **Password:** `Admin_pemilik`

## Stack

- Next.js 14 (App Router, React 18)
- Prisma ORM 5 + PostgreSQL 16
- NextAuth (Credentials, JWT session)
- TailwindCSS + lucide-react + recharts
- bcryptjs untuk hashing password

## Struktur

```
docker-app/
├── Dockerfile
├── docker-compose.yml      # app:3103, postgres:5433
├── prisma/
│   ├── schema.prisma
│   └── seed.ts             # seed admin + barang awal
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── (dashboard)/    # protected layout
│   │   │   ├── dashboard/
│   │   │   ├── barang/
│   │   │   ├── barang-masuk/
│   │   │   ├── barang-keluar/
│   │   │   └── manajemen-pengguna/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── barang/[id]/
│   │       ├── barang-masuk/
│   │       ├── barang-keluar/
│   │       └── users/[id]/reset-password/
│   ├── components/Sidebar.tsx
│   └── lib/{prisma,auth}.ts
└── middleware.ts           # route protection
```

## Fitur

- Dashboard: 3 stat card, grafik 12 bulan, monitoring kadaluarsa, 10 aktivitas terbaru.
- Barang: CRUD lengkap + filter kategori + pencarian.
- Barang Masuk: catat + stok otomatis bertambah + tanggal kadaluarsa.
- Barang Keluar: validasi stok cukup + stok otomatis berkurang.
- Manajemen Pengguna (admin only): Tambah / Edit / Hapus / Reset Password.

## Dev lokal (tanpa Docker)

```bash
cp .env.example .env       # arahkan DATABASE_URL ke postgres lokal
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev                 # http://localhost:3103
```

## Migrasi pertama kali (init)

Saat container pertama kali jalan, `migrate deploy` butuh folder `prisma/migrations`. Untuk membuatnya, jalankan SEKALI di mesin dev:

```bash
DATABASE_URL=postgresql://tokomf:tokomf_secret@localhost:5433/tokomf?schema=public npx prisma migrate dev --name init
```

Commit folder `prisma/migrations` yang dihasilkan, lalu `docker compose up --build`. Setelah itu setiap container start akan otomatis menerapkan migrasi + seed admin.

## Ganti password admin / secret produksi

Edit `docker-compose.yml`:
- `POSTGRES_PASSWORD` (Postgres)
- `NEXTAUTH_SECRET` (wajib min 32 char di produksi)
