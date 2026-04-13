# Progress Backend Fordza Web

**Terakhir diupdate:** 28 Maret 2026  
**Status keseluruhan backend:** ✅ Selesai (~95%)

---

## 📐 Database Schema

Model yang sudah dibuat di `prisma/schema.prisma`:

| # | Model | Tabel | Keterangan |
|---|-------|-------|------------|
| 1 | `Product` | `products` | Data utama produk + flag status |
| 2 | `ProductDetail` | `product_details` | Deskripsi, material, ukuran |
| 3 | `ProductCategory` | `product_categories` | Pivot table produk ↔ kategori |
| 4 | `Category` | `categories` | Kategori produk |
| 5 | `ProductImage` | `product_images` | Gambar produk (multi) |
| 6 | `SizeTemplate` | `size_templates` | Template ukuran reusable |
| 7 | `Testimonial` | `testimonials` | Review pelanggan |
| 8 | `Banner` | `banners` | Banner homepage |
| 9 | `Admin` | `admins` | Akun admin CMS |

**Status:** ✅ Lengkap

---

## 🔐 Autentikasi (`/api/admin/auth/*`)

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| POST | `/api/admin/auth/login` | Login → return access + refresh token | ✅ |
| POST | `/api/admin/auth/logout` | Hapus kedua cookie | ✅ |
| GET | `/api/admin/auth/me` | Cek session admin aktif | ✅ |
| POST | `/api/admin/auth/refresh` | Dapat access token baru pakai refresh token | ✅ |

**Fitur auth yang sudah ada:**
- ✅ Access token (15 menit) + Refresh token (7 hari)
- ✅ Token disimpan di HttpOnly cookie (aman dari XSS)
- ✅ Support Bearer header untuk Postman
- ✅ Password di-hash pakai bcrypt (salt 12)
- ✅ Middleware melindungi semua route `/api/admin/*`
- ✅ Validasi tipe token (access vs refresh)

---

## 🌐 Public API — Tanpa Auth (`/api/public/*`)

Untuk dipakai halaman website customer (read-only).

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/public/products` | List produk aktif (filter, search, pagination) | ✅ |
| GET | `/api/public/products/[id]` | Detail produk + related products | ✅ |
| GET | `/api/public/categories` | List kategori aktif | ✅ |
| GET | `/api/public/banners` | List banner aktif | ✅ |
| GET | `/api/public/size-templates` | List semua template ukuran | ✅ |
| GET | `/api/recommend/[id]` | Rekomendasi produk berdasarkan produk | ✅ |

> ⚠️ **Catatan:** Tidak ada endpoint public untuk **testimonials**. Testimonial sudah dimasukkan di dalam response `/api/public/products/[id]` (3 terbaru).

---

## 🔒 Admin API — Perlu Auth (`/api/admin/*`)

### Products

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/admin/products` | List SEMUA produk (termasuk inactive) | ✅ |
| POST | `/api/admin/products` | Tambah produk baru + upload gambar ke S3 | ✅ |
| GET | `/api/admin/products/[id]` | Detail produk | ✅ |
| PUT | `/api/admin/products/[id]` | Update produk + ganti gambar | ✅ |
| DELETE | `/api/admin/products/[id]` | Soft delete (set isActive = false) | ✅ |

### Categories

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/admin/categories` | List semua kategori | ✅ |
| POST | `/api/admin/categories` | Tambah kategori + upload gambar | ✅ |
| GET | `/api/admin/categories/[id]` | Detail kategori | ✅ |
| PUT | `/api/admin/categories/[id]` | Update kategori + ganti gambar | ✅ |
| DELETE | `/api/admin/categories/[id]` | Soft delete | ✅ |

### Banners

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/admin/banners` | List semua banner | ✅ |
| POST | `/api/admin/banners` | Tambah banner + upload gambar | ✅ |
| GET | `/api/admin/banners/[id]` | Detail banner | ✅ |
| PUT | `/api/admin/banners/[id]` | Update banner + ganti gambar | ✅ |
| DELETE | `/api/admin/banners/[id]` | Hapus banner + hapus gambar dari S3 | ✅ |

### Testimonials

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/admin/testimonials` | List testimonial (bisa filter by product) | ✅ |
| POST | `/api/admin/testimonials` | Tambah testimonial | ✅ |
| PUT | `/api/admin/testimonials/[id]` | Update testimonial | ✅ |
| DELETE | `/api/admin/testimonials/[id]` | Hapus testimonial + recalculate rating | ✅ |

> ℹ️ Tidak ada GET detail by ID untuk testimonial — biasanya tidak diperlukan karena list sudah cukup.

### Size Templates

| Method | Endpoint | Fungsi | Status |
|--------|----------|--------|--------|
| GET | `/api/admin/size-templates` | List semua template | ✅ |
| POST | `/api/admin/size-templates` | Tambah template baru | ✅ |
| GET | `/api/admin/size-templates/[id]` | Detail template | ✅ |
| PUT | `/api/admin/size-templates/[id]` | Update template | ✅ |
| DELETE | `/api/admin/size-templates/[id]` | Hapus template (gagal kalau masih dipakai produk) | ✅ |

---

## 🧠 Service Layer (`/services/*.db.ts`)

| File | Metode yang Ada |
|------|----------------|
| `products.db.ts` | `getAll`, `getById`, `getAllAdmin`, `create`, `update`, `delete`, `getRelated` |
| `category.db.ts` | `getAll`, `getById`, `getAllAdmin`, `create`, `update`, `delete` |
| `banner.db.ts` | `getAll`, `getById`, `create`, `update`, `delete` |
| `testimonial.db.ts` | `getAll`, `create`, `update`, `delete` (+ recalculate rating) |
| `size-template.db.ts` | `getAll`, `getById`, `create`, `update`, `delete` |
| `admin.db.ts` | `findByUsername`, `findById`, `create` |
| `recommendation.db.ts` | Rekomendasi produk berbasis kategori |

---

## ⚙️ Infrastruktur Pendukung

| File | Fungsi | Status |
|------|--------|--------|
| `lib/auth.ts` | Hash password, sign/verify JWT, cookie config | ✅ |
| `lib/prisma.ts` | Koneksi database (Neon PostgreSQL + adapter) | ✅ |
| `lib/s3.ts` | Koneksi S3 storage (Supabase) | ✅ |
| `middleware.ts` | Proteksi route `/api/admin/*` via JWT | ✅ |
| `actions/upload.ts` | Upload & delete file ke S3 | ✅ |
| `prisma/seed.ts` | Seed admin default + size templates | ✅ |
| `prisma/schema.prisma` | Definisi semua tabel database | ✅ |

---

## ❓ Yang Mungkin Perlu Ditambahkan

Ini bukan kesalahan, hanya fitur yang **belum ada** tapi mungkin berguna:

| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| **Ganti password admin** | 🟡 Sedang | Endpoint `PUT /api/admin/auth/password` untuk ubah password |
| **Upload gambar produk individual** | 🟡 Sedang | Saat ini upload gambar hanya bisa saat create/update produk sekaligus |
| **Sorting/filter di admin list** | 🟢 Rendah | Admin list produk belum punya filter by status/kategori |
| **Hapus gambar produk by ID** | 🟢 Rendah | Hapus 1 gambar spesifik dari produk yang punya banyak gambar |
| **Reorder banner** | 🟢 Rendah | Endpoint khusus untuk atur urutan tampil banner |

---

## 🗂️ Folder Lama yang Perlu Dihapus

> ⚠️ Folder ini adalah sisa sebelum refactor. Isinya **tidak dilindungi middleware** dan sudah digantikan oleh `/api/public/*` dan `/api/admin/*`. Sebaiknya dihapus.

```
app/api/
├── banners/        ← HAPUS (sudah ada di /api/admin/banners)
├── categories/     ← HAPUS (sudah ada di /api/admin/categories)
├── products/       ← HAPUS (sudah ada di /api/admin/products)
├── testimonials/   ← HAPUS (sudah ada di /api/admin/testimonials)
└── size-templates/ ← HAPUS (sudah ada di /api/admin/size-templates)
```

---

## ✅ Ringkasan

| Komponen | Status |
|----------|--------|
| Database schema (9 model) | ✅ Selesai |
| Auth (login, logout, refresh, me) | ✅ Selesai |
| Middleware JWT | ✅ Selesai |
| Public API (5 endpoint) | ✅ Selesai |
| Admin API — Products | ✅ Selesai (full CRUD) |
| Admin API — Categories | ✅ Selesai (full CRUD) |
| Admin API — Banners | ✅ Selesai (full CRUD) |
| Admin API — Testimonials | ✅ Selesai (full CRUD) |
| Admin API — Size Templates | ✅ Selesai (full CRUD) |
| S3 upload/delete | ✅ Selesai |
| Response optimization (list vs detail) | ✅ Selesai |
| **Frontend (halaman customer)** | ❌ Belum dimulai |
| **Admin CMS UI** | ❌ Belum dimulai |
