# API Reference - Fordza-Web

## 📋 Overview

Fordza-Web menyediakan RESTful API yang terbagi menjadi 3 kategori:

1. **Public API** (`/api/public/*`) - Tanpa autentikasi, untuk customer
2. **Admin API** (`/api/admin/*`) - Butuh autentikasi, untuk admin CMS
3. **Kasir API** (`/api/kasir/*`) - Butuh autentikasi, untuk sistem POS

---

## 🔐 Authentication

### **Access Token + Refresh Token (JWT)**

| Token | Masa Berlaku | Storage | Fungsi |
|-------|-------------|---------|--------|
| **Access Token** | 15 menit | HTTP-only cookie + localStorage | Akses API endpoints |
| **Refresh Token** | 7 hari | HTTP-only cookie | Perpanjang session |

### **Cara Menggunakan di Postman/Client**

1. **Login** untuk mendapatkan token:
```http
POST /api/admin/auth/login
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
    "id": "cm123...",
    "username": "admin",
    "name": "Admin Fordza",
    "role": "ADMIN",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

2. **Gunakan Access Token** di header untuk semua request ke `/api/admin/*` atau `/api/kasir/*`:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Refresh Token** ketika access token expired:
```http
POST /api/admin/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🌐 Base URL

**Development:** `http://localhost:3000`  
**Production:** `https://your-domain.com`

---

## 📦 Response Format

### **Success Response**
```json
{
  "success": true,
  "message": "Berhasil mengambil data",
  "data": { ... },
  "meta": {
    "totalItems": 100,
    "totalPage": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Gagal mengambil data",
  "error": "Error detail message"
}
```

---

## 🔓 Public API

Endpoints yang dapat diakses tanpa autentikasi.

### **1. Products**

#### **GET /api/public/products**
List produk dengan filter, search, sort, dan pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Cari berdasarkan nama produk |
| `categoryIds` | string[] | No | - | Filter by category IDs (comma-separated) |
| `gender` | string | No | - | Filter: "Man", "Woman", "Unisex" |
| `isPopular` | boolean | No | - | Filter produk populer |
| `isBestseller` | boolean | No | - | Filter produk bestseller |
| `isNew` | boolean | No | - | Filter produk baru |
| `minPrice` | number | No | 0 | Harga minimum |
| `maxPrice` | number | No | - | Harga maksimum |
| `sortBy` | string | No | "newest" | Sort: "newest", "cheapest", "expensive" |
| `page` | number | No | 1 | Halaman |
| `limit` | number | No | 10 | Items per halaman |

**Example Request:**
```http
GET /api/public/products?search=oxford&gender=Man&sortBy=cheapest&page=1&limit=12
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar produk",
  "data": {
    "products": [
      {
        "id": "cm123...",
        "productCode": "FRD-001",
        "name": "Oxford Classic Black",
        "shortDescription": "Sepatu formal kulit asli",
        "price": 850000,
        "finalPrice": 680000,
        "highestPrice": 850000,
        "totalDiscountPercent": 20,
        "promoName": "Diskon 20% Sepatu Formal",
        "stock": 45,
        "productType": "shoes",
        "gender": "Man",
        "isPopular": true,
        "isBestseller": true,
        "isNew": false,
        "avgRating": 4.8,
        "totalReviews": 24,
        "images": [
          {
            "id": "img123...",
            "url": "https://s3.amazonaws.com/..."
          }
        ],
        "categories": [
          {
            "category": {
              "id": "cat123...",
              "name": "Formal"
            }
          }
        ],
        "variants": [
          {
            "id": "var123...",
            "color": "Black",
            "basePrice": 850000,
            "comparisonPrice": null,
            "finalPrice": 680000,
            "totalDiscountPercent": 20,
            "promoName": "Diskon 20% Sepatu Formal",
            "skus": [
              {
                "id": "sku123...",
                "size": "40",
                "stock": 10,
                "priceOverride": null
              }
            ]
          }
        ]
      }
    ]
  },
  "meta": {
    "totalItems": 48,
    "totalPage": 4,
    "currentPage": 1,
    "limit": 12
  }
}
```

---

#### **GET /api/public/products/:id**
Detail produk lengkap dengan varian, SKU, testimoni, dan related products.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Example Request:**
```http
GET /api/public/products/cm123abc456
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil detail produk",
  "data": {
    "id": "cm123...",
    "productCode": "FRD-001",
    "name": "Oxford Classic Black",
    "shortDescription": "Sepatu formal kulit asli",
    "price": 850000,
    "finalPrice": 680000,
    "highestPrice": 850000,
    "totalDiscountPercent": 20,
    "promoName": "Diskon 20% Sepatu Formal",
    "stock": 45,
    "productType": "shoes",
    "gender": "Man",
    "avgRating": 4.8,
    "totalReviews": 24,
    "images": [
      {
        "id": "img123...",
        "url": "https://s3.amazonaws.com/...",
        "key": "products/1234567890-uuid.jpg"
      }
    ],
    "categories": [
      {
        "category": {
          "id": "cat123...",
          "name": "Formal",
          "imageUrl": "https://s3.amazonaws.com/..."
        }
      }
    ],
    "detail": {
      "description": "<p>Deskripsi lengkap produk...</p>",
      "notes": "Catatan tambahan",
      "material": "Kulit Asli",
      "outsole": "Rubber",
      "insole": "Memory Foam",
      "closureType": "Lace-up",
      "origin": "Indonesia",
      "sizeTemplateId": "tpl123...",
      "sizeTemplate": {
        "id": "tpl123...",
        "name": "EU Size",
        "type": "shoes",
        "sizes": ["39", "40", "41", "42", "43", "44", "45"]
      }
    },
    "variants": [
      {
        "id": "var123...",
        "variantCode": "FRD-001-BLK",
        "color": "Black",
        "basePrice": 850000,
        "comparisonPrice": null,
        "finalPrice": 680000,
        "totalDiscountPercent": 20,
        "promoDiscountPercent": 20,
        "promoName": "Diskon 20% Sepatu Formal",
        "images": [
          {
            "id": "vimg123...",
            "url": "https://s3.amazonaws.com/..."
          }
        ],
        "skus": [
          {
            "id": "sku123...",
            "size": "40",
            "stock": 10,
            "priceOverride": null,
            "finalPrice": 680000
          },
          {
            "id": "sku124...",
            "size": "46",
            "stock": 5,
            "priceOverride": 950000,
            "finalPrice": 760000
          }
        ]
      }
    ],
    "relatedProducts": [
      {
        "id": "cm456...",
        "name": "Derby Brown",
        "price": 780000,
        "images": [...]
      }
    ]
  }
}
```

---

### **2. Categories**

#### **GET /api/public/categories**
List kategori aktif.

**Example Request:**
```http
GET /api/public/categories
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar kategori",
  "data": [
    {
      "id": "cat123...",
      "name": "Formal",
      "shortDescription": "Koleksi sepatu formal pria",
      "imageUrl": "https://s3.amazonaws.com/...",
      "order": 1,
      "isActive": true
    },
    {
      "id": "cat456...",
      "name": "Casual",
      "shortDescription": "Sepatu casual untuk sehari-hari",
      "imageUrl": "https://s3.amazonaws.com/...",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

### **3. Banners**

#### **GET /api/public/banners**
List banner aktif untuk homepage carousel.

**Example Request:**
```http
GET /api/public/banners
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar banner",
  "data": [
    {
      "id": "bnr123...",
      "title": "Promo Akhir Tahun",
      "imageUrl": "https://s3.amazonaws.com/...",
      "linkUrl": "/products?promo=end-year",
      "isActive": true,
      "createdAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

---

### **4. Size Templates**

#### **GET /api/public/size-templates**
List template ukuran (EU, US, UK, dll).

**Example Request:**
```http
GET /api/public/size-templates
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar size template",
  "data": [
    {
      "id": "tpl123...",
      "name": "EU Size",
      "type": "shoes",
      "sizes": ["39", "40", "41", "42", "43", "44", "45"],
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "tpl456...",
      "name": "US Size",
      "type": "shoes",
      "sizes": ["7", "8", "9", "10", "11", "12"],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### **5. Testimonials**

#### **GET /api/public/testimonials**
List testimoni produk.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | No | Filter by product ID |

**Example Request:**
```http
GET /api/public/testimonials?productId=cm123abc456
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar testimoni",
  "data": [
    {
      "id": "tst123...",
      "productId": "cm123...",
      "customerName": "John Doe",
      "rating": 5,
      "content": "Kualitas kulit sangat bagus, nyaman dipakai!",
      "isActive": true,
      "createdAt": "2026-05-10T10:30:00.000Z"
    }
  ]
}
```

---

### **6. Recommendations**

#### **GET /api/recommend/:id**
Rekomendasi produk berdasarkan KNN algorithm.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Example Request:**
```http
GET /api/recommend/cm123abc456
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil rekomendasi produk",
  "data": [
    {
      "id": "cm456...",
      "name": "Derby Brown",
      "price": 780000,
      "images": [...],
      "distance": 0.23
    }
  ]
}
```

---

## 🔒 Admin API

Endpoints yang membutuhkan autentikasi dengan role ADMIN.

**Header Required:**
```http
Authorization: Bearer <accessToken>
```

### **Authentication**

#### **POST /api/admin/auth/login**
Login admin untuk mendapatkan access token dan refresh token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "fordza2026"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm123...",
    "username": "admin",
    "name": "Admin Fordza",
    "role": "ADMIN",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### **POST /api/admin/auth/refresh**
Refresh access token menggunakan refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### **POST /api/admin/auth/logout**
Logout dan hapus semua token.

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

#### **GET /api/admin/auth/me**
Cek session admin saat ini.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm123...",
    "username": "admin",
    "name": "Admin Fordza",
    "role": "ADMIN"
  }
}
```

---


### **Products Management**

#### **GET /api/admin/products**
List semua produk (termasuk inactive) dengan pagination.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Cari berdasarkan nama atau kode produk |
| `page` | number | No | 1 | Halaman |
| `limit` | number | No | 10 | Items per halaman |

**Example Request:**
```http
GET /api/admin/products?search=oxford&page=1&limit=10
Authorization: Bearer <accessToken>
```

**Example Response:**
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar produk",
  "data": [
    {
      "id": "cm123...",
      "productCode": "FRD-001",
      "name": "Oxford Classic Black",
      "price": 850000,
      "finalPrice": 680000,
      "stock": 45,
      "isActive": true,
      "variants": [...],
      "categories": [...]
    }
  ],
  "meta": {
    "totalItems": 48,
    "totalPage": 5,
    "currentPage": 1,
    "limit": 10
  }
}
```

---

#### **POST /api/admin/products**
Buat produk baru dengan varian dan SKU.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productCode` | string | Yes | Kode produk unik |
| `name` | string | Yes | Nama produk |
| `shortDescription` | string | Yes | Deskripsi singkat |
| `productType` | string | Yes | Tipe: "shoes", "sandals", "boots" |
| `gender` | string | Yes | "Man", "Woman", "Unisex" |
| `categoryIds` | string[] | Yes | Array category IDs |
| `description` | string | No | Deskripsi lengkap (HTML) |
| `material` | string | No | Material produk |
| `outsole` | string | No | Jenis outsole |
| `insole` | string | No | Jenis insole |
| `closureType` | string | No | Tipe penutup |
| `origin` | string | No | Negara asal |
| `sizeTemplateId` | string | No | Size template ID |
| `isPopular` | boolean | No | Flag popular |
| `isBestseller` | boolean | No | Flag bestseller |
| `isNew` | boolean | No | Flag new |
| `images` | File[] | No | Gambar produk utama |
| `variants` | JSON string | Yes | Array varian (lihat contoh) |

**Variants JSON Structure:**
```json
[
  {
    "color": "Black",
    "basePrice": 850000,
    "comparisonPrice": null,
    "images": [
      { "url": "https://...", "key": "variants/..." }
    ],
    "skus": [
      { "size": "40", "stock": 10, "priceOverride": null },
      { "size": "41", "stock": 15, "priceOverride": null },
      { "size": "46", "stock": 5, "priceOverride": 950000 }
    ]
  }
]
```

**Example Request (Postman):**
```
POST /api/admin/products
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Body (form-data):
  productCode: FRD-001
  name: Oxford Classic Black
  shortDescription: Sepatu formal kulit asli
  productType: shoes
  gender: Man
  categoryIds: cat123,cat456
  description: <p>Deskripsi lengkap...</p>
  material: Kulit Asli
  variants: [{"color":"Black","basePrice":850000,...}]
  images: [file1.jpg, file2.jpg]
```

**Response:**
```json
{
  "success": true,
  "message": "Produk berhasil dibuat",
  "data": {
    "id": "cm123...",
    "productCode": "FRD-001",
    "name": "Oxford Classic Black",
    ...
  }
}
```

---

#### **GET /api/admin/products/:id**
Detail produk lengkap untuk admin.

**Example Request:**
```http
GET /api/admin/products/cm123abc456
Authorization: Bearer <accessToken>
```

**Response:** (sama seperti public API tapi include inactive items)

---

#### **PUT /api/admin/products/:id**
Update produk existing.

**Content-Type:** `multipart/form-data`

**Form Fields:** (sama seperti POST, semua optional kecuali yang ingin diupdate)

**Example Request:**
```
PUT /api/admin/products/cm123abc456
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Body (form-data):
  name: Oxford Classic Black (Updated)
  price: 900000
  isActive: true
```

**Response:**
```json
{
  "success": true,
  "message": "Produk berhasil diupdate",
  "data": { ... }
}
```

---

#### **DELETE /api/admin/products/:id**
Soft delete produk (set isActive=false, deletedAt=now).

**Example Request:**
```http
DELETE /api/admin/products/cm123abc456
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Produk berhasil dihapus"
}
```

---

#### **POST /api/admin/products/:id/images**
Tambah gambar ke produk existing.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File[] | Yes | Array gambar |

**Example Request:**
```
POST /api/admin/products/cm123abc456/images
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

Body (form-data):
  images: [file1.jpg, file2.jpg]
```

**Response:**
```json
{
  "success": true,
  "message": "Gambar berhasil ditambahkan",
  "data": [
    {
      "id": "img123...",
      "url": "https://s3.amazonaws.com/...",
      "key": "products/..."
    }
  ]
}
```

---

#### **DELETE /api/admin/products/:id/images/:imageId**
Hapus gambar produk (delete dari S3 + database).

**Example Request:**
```http
DELETE /api/admin/products/cm123abc456/images/img123xyz
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Gambar berhasil dihapus"
}
```

---

#### **POST /api/admin/products/bulk-import**
Bulk import produk dari CSV.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "products": [
    {
      "productCode": "FRD-002",
      "name": "Derby Brown",
      "shortDescription": "Sepatu derby kulit",
      "productType": "shoes",
      "gender": "Man",
      "categoryIds": ["cat123"],
      "variants": [
        {
          "color": "Brown",
          "basePrice": 780000,
          "skus": [
            { "size": "40", "stock": 10 }
          ]
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk import selesai",
  "data": {
    "success": 45,
    "failed": 3,
    "errors": [
      {
        "productCode": "FRD-999",
        "message": "Kode produk sudah ada"
      }
    ]
  }
}
```

---

#### **PATCH /api/admin/products/bulk-stock**
Bulk update stok produk/SKU.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "items": [
    { "id": "sku123...", "stock": 50 },
    { "id": "sku456...", "stock": 30 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stok berhasil diupdate",
  "data": {
    "updated": 2
  }
}
```

---

#### **GET /api/admin/products/export**
Export produk ke Excel.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Filter search |

**Example Request:**
```http
GET /api/admin/products/export?search=oxford
Authorization: Bearer <accessToken>
```

**Response:** File Excel (download)

---

### **Variants Management**

#### **GET /api/admin/products/:id/variants**
List varian per produk.

**Example Request:**
```http
GET /api/admin/products/cm123abc456/variants
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "var123...",
      "variantCode": "FRD-001-BLK",
      "color": "Black",
      "basePrice": 850000,
      "skus": [...]
    }
  ]
}
```

---

#### **POST /api/admin/products/:id/variants**
Tambah varian baru ke produk.

**Request Body:**
```json
{
  "color": "Brown",
  "basePrice": 850000,
  "comparisonPrice": null,
  "images": [
    { "url": "https://...", "key": "variants/..." }
  ],
  "skus": [
    { "size": "40", "stock": 10, "priceOverride": null }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Varian berhasil ditambahkan",
  "data": { ... }
}
```

---

#### **PATCH /api/admin/variants/:variantId**
Update varian existing.

**Request Body:**
```json
{
  "color": "Dark Brown",
  "basePrice": 900000,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Varian berhasil diupdate"
}
```

---

#### **DELETE /api/admin/variants/:variantId**
Soft delete varian.

**Example Request:**
```http
DELETE /api/admin/variants/var123abc456
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Varian berhasil dihapus"
}
```

---

#### **GET /api/admin/variants**
Search varian (untuk autocomplete).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Cari berdasarkan kode atau warna |

**Example Request:**
```http
GET /api/admin/variants?search=black
Authorization: Bearer <accessToken>
```

---

### **SKUs Management**

#### **POST /api/admin/variants/:variantId/skus**
Tambah SKU baru ke varian.

**Request Body:**
```json
{
  "size": "46",
  "stock": 5,
  "priceOverride": 950000
}
```

**Response:**
```json
{
  "success": true,
  "message": "SKU berhasil ditambahkan",
  "data": {
    "id": "sku123...",
    "size": "46",
    "stock": 5,
    "priceOverride": 950000
  }
}
```

---

#### **PATCH /api/admin/skus/:skuId**
Update SKU existing.

**Request Body:**
```json
{
  "stock": 10,
  "priceOverride": 1000000,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "SKU berhasil diupdate"
}
```

---

#### **DELETE /api/admin/skus/:skuId**
Soft delete SKU.

**Example Request:**
```http
DELETE /api/admin/skus/sku123abc456
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "message": "SKU berhasil dihapus"
}
```

---


### **Categories Management**

#### **GET /api/admin/categories**
List semua kategori.

**Example Request:**
```http
GET /api/admin/categories
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat123...",
      "name": "Formal",
      "shortDescription": "Koleksi sepatu formal",
      "imageUrl": "https://...",
      "order": 1,
      "isActive": true
    }
  ]
}
```

---

#### **POST /api/admin/categories**
Buat kategori baru.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Nama kategori |
| `shortDescription` | string | No | Deskripsi singkat |
| `order` | number | No | Urutan tampilan |
| `image` | File | Yes | Gambar kategori |

**Response:**
```json
{
  "success": true,
  "message": "Kategori berhasil dibuat",
  "data": { ... }
}
```

---

#### **PUT /api/admin/categories/:id**
Update kategori.

**Content-Type:** `multipart/form-data`

---

#### **DELETE /api/admin/categories/:id**
Soft delete kategori.

---

### **Banners Management**

#### **GET /api/admin/banners**
List semua banner.

---

#### **POST /api/admin/banners**
Buat banner baru.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Judul banner |
| `linkUrl` | string | No | URL tujuan |
| `image` | File | Yes | Gambar banner |

---

#### **PUT /api/admin/banners/:id**
Update banner.

---

#### **DELETE /api/admin/banners/:id**
Hapus banner (hard delete + hapus dari S3).

---

### **Testimonials Management**

#### **GET /api/admin/testimonials**
List testimoni dengan filter.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | No | Filter by product |

---

#### **POST /api/admin/testimonials**
Buat testimoni baru.

**Request Body:**
```json
{
  "productId": "cm123...",
  "customerName": "John Doe",
  "rating": 5,
  "content": "Kualitas sangat bagus!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Testimoni berhasil dibuat",
  "data": { ... }
}
```

---

#### **PUT /api/admin/testimonials/:id**
Update testimoni.

---

#### **DELETE /api/admin/testimonials/:id**
Hapus testimoni (auto-recalculate product rating).

---

### **Size Templates Management**

#### **GET /api/admin/size-templates**
List semua size templates.

---

#### **POST /api/admin/size-templates**
Buat size template baru.

**Request Body:**
```json
{
  "name": "EU Size",
  "type": "shoes",
  "sizes": ["39", "40", "41", "42", "43", "44", "45"]
}
```

---

#### **PUT /api/admin/size-templates/:id**
Update size template.

---

#### **DELETE /api/admin/size-templates/:id**
Hapus size template.

---

### **Users Management**

#### **GET /api/admin/users**
List semua user (admin & kasir).

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "usr123...",
      "username": "kasir1",
      "name": "Kasir Satu",
      "role": "KASIR",
      "pin": "1234",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### **POST /api/admin/users**
Buat user baru (admin atau kasir).

**Request Body:**
```json
{
  "username": "kasir2",
  "password": "password123",
  "name": "Kasir Dua",
  "role": "KASIR",
  "pin": "5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": { ... }
}
```

---

#### **PATCH /api/admin/users/:id**
Update user.

**Request Body:**
```json
{
  "name": "Kasir Dua (Updated)",
  "pin": "9999"
}
```

---

#### **DELETE /api/admin/users/:id**
Soft delete user.

---

#### **GET /api/admin/cashiers**
List kasir saja (untuk dropdown).

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "usr123...",
      "username": "kasir1",
      "name": "Kasir Satu"
    }
  ]
}
```

---

### **Stock Management**

#### **GET /api/admin/stock/logs**
List stock logs (product level).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | No | Filter by product |
| `type` | string | No | Filter: SALE, VOID, RESTOCK, ADJUSTMENT |
| `startDate` | string | No | ISO date |
| `endDate` | string | No | ISO date |
| `page` | number | No | Pagination |
| `limit` | number | No | Items per page |

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log123...",
      "productId": "cm123...",
      "delta": -2,
      "currentStock": 43,
      "type": "SALE",
      "notes": "Transaksi INV-20260514-001",
      "operatorId": "usr123...",
      "createdAt": "2026-05-14T10:30:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

#### **GET /api/admin/stock/logs/sku**
List SKU stock logs (SKU level).

**Query Parameters:** (sama seperti stock logs)

---

#### **GET /api/admin/stock/logs/export**
Export stock logs ke Excel.

---

#### **GET /api/admin/stock/logs/sku/export**
Export SKU stock logs ke Excel.

---

### **Reports**

#### **GET /api/admin/reports**
Sales report summary.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | ISO date (default: today) |
| `endDate` | string | No | ISO date (default: today) |
| `kasirId` | string | No | Filter by kasir |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000000,
    "totalTransactions": 45,
    "totalItems": 67,
    "avgTransactionValue": 333333,
    "chartData": [
      { "date": "2026-05-14", "revenue": 5000000, "transactions": 15 }
    ]
  }
}
```

---

#### **GET /api/admin/reports/items**
Sales report by items (produk terlaris).

**Query Parameters:** (sama seperti reports)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "cm123...",
      "productName": "Oxford Classic Black",
      "productCode": "FRD-001",
      "variantColor": "Black",
      "skuSize": "40",
      "totalQty": 12,
      "totalRevenue": 8160000,
      "totalOrders": 8
    }
  ],
  "meta": { ... }
}
```

---

#### **GET /api/admin/reports/export/summary**
Export sales summary ke Excel.

---

#### **GET /api/admin/reports/export/items**
Export sales items ke Excel.

---

### **Shifts Management**

#### **POST /api/admin/shifts/open**
Buka shift baru.

**Request Body:**
```json
{
  "startingCash": 500000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shift berhasil dibuka",
  "data": {
    "id": "shf123...",
    "adminId": "usr123...",
    "startTime": "2026-05-14T08:00:00.000Z",
    "startingCash": 500000,
    "status": "OPEN"
  }
}
```

---

#### **POST /api/admin/shifts/close**
Tutup shift aktif.

**Request Body:**
```json
{
  "actualEndingCash": 5500000,
  "notes": "Shift berjalan lancar"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shift berhasil ditutup",
  "data": {
    "id": "shf123...",
    "endTime": "2026-05-14T17:00:00.000Z",
    "expectedEndingCash": 5450000,
    "actualEndingCash": 5500000,
    "difference": 50000,
    "status": "CLOSED"
  }
}
```

---

#### **GET /api/admin/shifts/current**
Cek shift aktif saat ini.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "shf123...",
    "adminId": "usr123...",
    "admin": {
      "name": "Kasir Satu"
    },
    "startTime": "2026-05-14T08:00:00.000Z",
    "startingCash": 500000,
    "status": "OPEN"
  }
}
```

---

### **Transactions Management**

#### **GET /api/admin/transactions**
List semua transaksi.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: PAID, VOID |
| `kasirId` | string | No | Filter by kasir |
| `startDate` | string | No | ISO date |
| `endDate` | string | No | ISO date |
| `page` | number | No | Pagination |
| `limit` | number | No | Items per page |

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trx123...",
      "invoiceNo": "INV-20260514-001",
      "totalPrice": 680000,
      "amountPaid": 700000,
      "change": 20000,
      "status": "PAID",
      "kasir": {
        "name": "Kasir Satu"
      },
      "items": [
        {
          "productName": "Oxford Classic Black",
          "quantity": 1,
          "priceAtSale": 680000
        }
      ],
      "createdAt": "2026-05-14T10:30:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

#### **GET /api/admin/transactions/:id**
Detail transaksi.

---

#### **GET /api/admin/transactions/export**
Export transaksi ke Excel.

---

### **Promo Management**

#### **GET /api/admin/promo**
List semua promo.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prm123...",
      "name": "Diskon 20% Sepatu Formal",
      "description": "Promo akhir tahun",
      "type": "PERCENTAGE",
      "value": 20,
      "targetType": "CATEGORY",
      "targetIds": ["cat123..."],
      "minPurchase": 0,
      "isActive": true,
      "startDate": "2026-05-01T00:00:00.000Z",
      "endDate": "2026-12-31T23:59:59.000Z"
    }
  ]
}
```

---

#### **POST /api/admin/promo**
Buat promo baru.

**Request Body:**
```json
{
  "name": "Diskon 50rb Min. Belanja 500rb",
  "description": "Promo spesial",
  "type": "NOMINAL",
  "value": 50000,
  "targetType": "GLOBAL",
  "targetIds": [],
  "minPurchase": 500000,
  "isActive": true,
  "startDate": "2026-05-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Promo berhasil dibuat",
  "data": { ... }
}
```

---

#### **GET /api/admin/promo/:id**
Detail promo.

---

#### **PATCH /api/admin/promo/:id**
Update promo.

---

#### **DELETE /api/admin/promo/:id**
Hapus promo.

---

### **Dashboard**

#### **GET /api/admin/dashboard**
Dashboard statistics.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "todayRevenue": 5000000,
    "todayTransactions": 15,
    "totalProducts": 120,
    "lowStockProducts": 8,
    "recentTransactions": [...]
  }
}
```

---

## 💳 Kasir API

Endpoints untuk sistem POS (Point of Sale).

**Header Required:**
```http
Authorization: Bearer <accessToken>
```

### **Products for POS**

#### **GET /api/kasir/products**
List produk untuk POS dengan harga final (sudah termasuk promo).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Cari produk |
| `page` | number | No | Pagination |
| `limit` | number | No | Items per page |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "cm123...",
        "productCode": "FRD-001",
        "name": "Oxford Classic Black",
        "price": 850000,
        "stock": 45,
        "hasVariants": true,
        "imageUrl": "https://...",
        "variants": [
          {
            "id": "var123...",
            "color": "Black",
            "basePrice": 850000,
            "finalPrice": 680000,
            "additionalDiscount": 170000,
            "promoName": "Diskon 20% Sepatu Formal",
            "promoDiscountPercent": 20,
            "skus": [
              {
                "id": "sku123...",
                "size": "40",
                "stock": 10,
                "priceOverride": null,
                "finalPrice": 680000
              },
              {
                "id": "sku124...",
                "size": "46",
                "stock": 5,
                "priceOverride": 950000,
                "finalPrice": 760000
              }
            ]
          }
        ]
      }
    ],
    "meta": { ... }
  }
}
```

---

### **Transactions**

#### **POST /api/kasir/transactions**
Checkout transaksi baru.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "cm123...",
      "variantId": "var123...",
      "skuId": "sku123...",
      "quantity": 1,
      "priceAtSale": 680000,
      "discountAmount": 170000,
      "comparisonPriceAtSale": null,
      "promoName": "Diskon 20% Sepatu Formal"
    }
  ],
  "totalPrice": 680000,
  "amountPaid": 700000,
  "change": 20000,
  "customerName": "John Doe",
  "customerPhone": "081234567890",
  "notes": "Catatan tambahan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaksi berhasil",
  "data": {
    "id": "trx123...",
    "invoiceNo": "INV-20260514-001",
    "totalPrice": 680000,
    "amountPaid": 700000,
    "change": 20000,
    "status": "PAID",
    "items": [...],
    "createdAt": "2026-05-14T10:30:00.000Z"
  }
}
```

---

#### **GET /api/kasir/transactions**
History transaksi kasir.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Pagination |
| `limit` | number | No | Items per page |

---

#### **GET /api/kasir/transactions/:id**
Detail transaksi.

---

#### **PATCH /api/kasir/transactions/:id**
Void transaksi (butuh admin PIN).

**Request Body:**
```json
{
  "adminPin": "1234",
  "cancelReason": "Salah input"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaksi berhasil di-void",
  "data": {
    "id": "trx123...",
    "status": "VOID",
    "cancelReason": "Salah input"
  }
}
```

---

### **Admin PIN Verification**

#### **POST /api/kasir/auth/verify-pin**
Verify admin PIN untuk void transaction.

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN valid",
  "data": {
    "adminId": "usr123...",
    "adminName": "Admin Fordza"
  }
}
```

---

## 📝 Notes

### **Error Codes**
- **200:** Success
- **400:** Bad Request (validation error)
- **401:** Unauthorized (token invalid/expired)
- **403:** Forbidden (insufficient permission)
- **404:** Not Found
- **500:** Internal Server Error

### **Rate Limiting**
- Public API: 100 requests/minute
- Admin API: 200 requests/minute
- Kasir API: 500 requests/minute

### **File Upload Limits**
- Max file size: 5MB per file
- Allowed types: jpg, jpeg, png, webp
- Max files per request: 10

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
