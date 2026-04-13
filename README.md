# FORDZA WEB — Progress Backend API

## ✅ Status: Backend API Selesai

**Last Updated:** 22 Februari 2026

---

## 🔐 Sistem Autentikasi

### Access Token + Refresh Token (JWT)

| Token | Masa Berlaku | Fungsi |
|-------|-------------|--------|
| **Access Token** | 15 menit | Akses semua endpoint `/api/admin/*` |
| **Refresh Token** | 7 hari | Dapat access token baru tanpa login ulang |

### Cara Kerja di Postman

**Login** → dapat `accessToken` + `refreshToken` di response body.

Untuk semua request ke `/api/admin/*`, tambahkan header:
```
Authorization: Bearer <accessToken>
```

Ketika access token expired, panggil refresh untuk dapat yang baru.

### Auth Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/admin/auth/login` | Login, dapat access + refresh token |
| POST | `/api/admin/auth/refresh` | Refresh access token |
| POST | `/api/admin/auth/logout` | Hapus semua token |
| GET | `/api/admin/auth/me` | Cek session admin |

### Kredensial Admin Default
```
Username: admin
Password: fordza2026
```

---

## 📋 Daftar Lengkap API Endpoint

### Public API (Customer — Tanpa Auth)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/public/products` | List produk (filter, search, sort, pagination) |
| GET | `/api/public/products/:id` | Detail produk + related products |
| GET | `/api/public/categories` | List kategori aktif |
| GET | `/api/public/banners` | List banner aktif |
| GET | `/api/public/size-templates` | List template ukuran |

### Admin API (Butuh Auth — Bearer Token)

#### Products
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/admin/products` | List semua produk (termasuk inactive) |
| POST | `/api/admin/products` | Buat produk baru (FormData + images) |
| GET | `/api/admin/products/:id` | Detail produk |
| PUT | `/api/admin/products/:id` | Update produk (FormData) |
| DELETE | `/api/admin/products/:id` | Soft delete (set isActive=false) |

#### Categories
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/admin/categories` | List semua kategori |
| POST | `/api/admin/categories` | Buat kategori (FormData + image) |
| GET | `/api/admin/categories/:id` | Detail kategori |
| PUT | `/api/admin/categories/:id` | Update kategori (FormData) |
| DELETE | `/api/admin/categories/:id` | Soft delete |

#### Testimonials
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/admin/testimonials` | List testimoni (?productId=xxx) |
| POST | `/api/admin/testimonials` | Buat testimoni (JSON) |
| PUT | `/api/admin/testimonials/:id` | Update testimoni (JSON) |
| DELETE | `/api/admin/testimonials/:id` | Hapus testimoni (+ recalculate rating) |

#### Banners
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/admin/banners` | List semua banner |
| POST | `/api/admin/banners` | Buat banner (FormData + image) |
| GET | `/api/admin/banners/:id` | Detail banner |
| PUT | `/api/admin/banners/:id` | Update banner (FormData) |
| DELETE | `/api/admin/banners/:id` | Hapus banner (+ hapus gambar S3) |

#### Size Templates
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/admin/size-templates` | List template |
| POST | `/api/admin/size-templates` | Buat template (JSON) |
| GET | `/api/admin/size-templates/:id` | Detail template |
| PUT | `/api/admin/size-templates/:id` | Update template (JSON) |
| DELETE | `/api/admin/size-templates/:id` | Hapus template |

---

## 🧪 Panduan Testing Postman

### Step 1: Login

```
POST http://localhost:3000/api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "fordza2026"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "admin",
    "name": "Admin Fordza",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Simpan `accessToken` dan `refreshToken` dari response!**

### Step 2: Set Authorization di Postman

Untuk SEMUA request ke `/api/admin/*`:

1. Buka tab **Authorization**
2. Pilih Type: **Bearer Token**
3. Paste `accessToken` yang didapat dari login

Atau manual di header:
```
Authorization: Bearer eyJhbG...
```

### Step 3: Test Public API (tanpa auth)

```
GET http://localhost:3000/api/public/products
GET http://localhost:3000/api/public/categories
GET http://localhost:3000/api/public/banners
```

### Step 4: Test Admin CRUD

**Buat Kategori:**
```
POST http://localhost:3000/api/admin/categories
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Body (form-data):
  name: Sepatu Formal
  shortDescription: Koleksi sepatu formal pria
  order: 1
  image: [pilih file gambar]
```

**Buat Produk:**
```
POST http://localhost:3000/api/admin/products
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Body (form-data):
  name: Oxford Classic
  price: 850000
  shortDescription: Sepatu oxford kulit asli
  productType: shoes
  gender: Man
  categoryIds: <id_kategori>
  description: Deskripsi lengkap produk...
  images: [pilih file gambar]
```

**Buat Testimoni:**
```
POST http://localhost:3000/api/admin/testimonials
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "productId": "<id_produk>",
  "customerName": "John Doe",
  "rating": 5,
  "content": "Kualitas kulit sangat bagus!"
}
```

### Step 5: Refresh Token

Ketika access token expired (15 menit), panggil:
```
POST http://localhost:3000/api/admin/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG... (token baru)"
  }
}
```

### Step 6: Test Access Tanpa Token

```
GET http://localhost:3000/api/admin/products
(tanpa Authorization header)
```

Expected: `401 Unauthorized`

---

## 📂 Struktur File Backend

```
e:\fordza-web\
├── prisma/
│   ├── schema.prisma          ← 9 model (+ Admin)
│   └── seed.ts                ← Seed admin + size templates
├── lib/
│   ├── auth.ts                ← JWT access/refresh token + bcrypt
│   ├── prisma.ts              ← Prisma client
│   ├── s3.ts                  ← S3 client
│   └── zod-schemas.ts         ← Validasi input
├── middleware.ts               ← Proteksi /api/admin/* (cookie + Bearer)
├── services/
│   ├── admin.db.ts            ← Admin CRUD
│   ├── products.db.ts         ← Product CRUD + filter + related
│   ├── category.db.ts         ← Category CRUD
│   ├── testimonial.db.ts      ← Testimonial CRUD + auto rating
│   ├── size-template.db.ts    ← Size Template CRUD
│   └── banner.db.ts           ← Banner CRUD
├── actions/
│   └── upload.ts              ← S3 upload/delete
└── app/api/
    ├── public/                ← Customer (GET only, no auth)
    │   ├── products/
    │   ├── categories/
    │   ├── banners/
    │   └── size-templates/
    └── admin/                 ← Admin (full CRUD, auth required)
        ├── auth/
        │   ├── login/
        │   ├── logout/
        │   ├── refresh/
        │   └── me/
        ├── products/
        ├── categories/
        ├── testimonials/
        ├── banners/
        └── size-templates/
```

---

## ⚠️ Yang Masih Perlu Dikerjakan (Frontend)

| Item | Status |
|------|--------|
| Halaman Home (`/`) | ❌ |
| Halaman Kategori (`/kategori`) | ❌ |
| Halaman Koleksi (`/koleksi`) | ❌ |
| Halaman Detail Produk (`/produk/[id]`) | ✅ |
| Halaman Tentang (`/tentang`) | ❌ |
| Halaman Panduan Ukuran (`/panduan-ukuran`) | ❌ |
| Admin CMS Dashboard (UI) | ✅ |
| Navbar & Bottom Navigation | ❌ |
| UI Components (Card, Carousel, dll) | ❌ |

> **Backend sudah 100% selesai.** Tinggal frontend (halaman user + admin CMS UI).
