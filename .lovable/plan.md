# Sistem Manajemen Stok — Toko Musthofa Farras

Aplikasi yang berjalan di preview Lovable memakai **Lovable Cloud** (Supabase) untuk database & auth. Sebagai bonus, saya juga akan generate proyek **Next.js + Prisma + Postgres + Docker** terpisah di folder `docker-app/` siap di-run dengan `docker compose up` pada port **3103**.

## 1. Versi Lovable (live preview)

### Stack
- TanStack Start + React + Tailwind + shadcn/ui
- Lovable Cloud (Supabase) untuk DB, Auth, RLS

### Halaman & Routing
- `/auth` — Login bergaya screenshot 1: panel hijau gelap, logo bulat "MF", judul "TOKO MUSTHOFA FARRAS", tagline, 2 input, tombol Login krem
- `/_authenticated/dashboard` — Card statistik, grafik bar Barang Masuk/Keluar (Recharts), tabel Monitoring Kadaluarsa, tabel 10 Aktivitas Terakhir
- `/_authenticated/barang` — CRUD master barang + search + pagination
- `/_authenticated/barang-masuk` — Form + list, auto-tambah stok
- `/_authenticated/barang-keluar` — Form + list, auto-kurang stok, validasi tidak melebihi stok
- `/_authenticated/manajemen-pengguna` — Admin only: tambah/edit/hapus user + reset password
- Sidebar: Logo MF • Dashboard • **Master** › Barang • **Pembukuan Stok** › Barang Masuk, Barang Keluar • **Pengaturan** › Manajemen Pengguna (admin only) • Logout (merah muda)

### Skema Database (Supabase)
- `profiles` (id→auth.users, full_name, username)
- `user_roles` (user_id, role enum: `administrator`|`staff`) + fungsi `has_role()` security definer
- `barang` (id, kode, nama, kategori, satuan, minimal_stok, stok)
- `barang_masuk` (id, barang_id, jumlah, tanggal_masuk, tanggal_kadaluarsa, keterangan, created_by)
- `barang_keluar` (id, barang_id, jumlah, tanggal_keluar, keterangan, created_by)
- Trigger Postgres untuk update `barang.stok` otomatis saat insert/delete masuk/keluar
- Trigger validasi stok ≥ jumlah keluar
- RLS: semua user terotentikasi bisa baca/insert transaksi; hanya admin yang bisa CRUD users/roles
- Seed admin: `Admin_pemilik` (password di-set saat user pertama signup atau via Auth dashboard)

### Status warna kadaluarsa
- > 30 hari: "Aman" (hijau)
- 8–30 hari: "Perlu Dipantau" (biru)
- ≤ 7 hari: "Hati-Hati" (kuning)
- lewat: "Kadaluarsa" (merah)

### Design tokens (src/styles.css)
Hijau tua `#1f4d3a` sebagai primary, krem `#dcd8a8` sebagai accent (tombol login), background card putih, header tabel hijau tua dengan teks putih — mirroring screenshot.

## 2. Bonus: Folder `docker-app/` (Next.js + Prisma + Postgres)

Struktur:
```
docker-app/
  Dockerfile
  docker-compose.yml          # app:3103, postgres:5432
  package.json
  prisma/
    schema.prisma             # User, Barang, BarangMasuk, BarangKeluar, Role enum
    seed.ts                   # admin: Admin_pemilik / Admin_pemilik
  src/app/
    login/page.tsx
    (dashboard)/layout.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/barang/page.tsx
    (dashboard)/barang-masuk/page.tsx
    (dashboard)/barang-keluar/page.tsx
    (dashboard)/users/page.tsx
    api/auth/[...nextauth]/route.ts
    api/barang/route.ts ...
  src/lib/prisma.ts, auth.ts, rbac.ts
```

- NextAuth credentials provider + bcrypt
- Middleware role-gate (`staff` tidak bisa akses `/users`)
- `docker-compose up` jalankan `prisma migrate deploy && prisma db seed && next start -p 3103`
- README dengan instruksi `docker compose up --build`

## Teknis penting
- Versi Lovable & versi Docker adalah dua codebase terpisah dalam satu repo
- Preview Lovable hanya menjalankan versi TanStack/Cloud (Cloudflare Workers tidak bisa run Prisma/Docker)
- `docker-app/` harus dijalankan user di mesin lokal mereka sendiri

Setelah disetujui saya akan: aktifkan Lovable Cloud → buat migrasi & RLS → bangun UI Lovable → generate `docker-app/` lengkap.
