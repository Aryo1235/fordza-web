# Arsitektur Sistem Fordza-Web

## 📋 Overview

Fordza-Web adalah sistem e-commerce dan Point of Sale (POS) terintegrasi yang dibangun dengan arsitektur modern full-stack. Sistem ini dirancang untuk mengelola produk sepatu dengan varian kompleks (warna, ukuran), sistem promo bertingkat, dan operasional kasir real-time.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16.1.2 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Component Library:** Radix UI + Shadcn/UI
- **Animation:** Framer Motion 12.38.0
- **Form Management:** React Hook Form 7.72.0
- **Validation:** Zod 4.3.5
- **State Management:** TanStack Query 5.95.2
- **Rich Text Editor:** Tiptap 3.22.3
- **Charts:** Recharts 3.8.1
- **Icons:** Lucide React 0.562.0

### **Backend**
- **Runtime:** Node.js
- **API:** Next.js API Routes (REST)
- **ORM:** Prisma 7.2.0 (with Neon adapter via @prisma/adapter-pg)
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** JWT (Jose 6.1.3) + bcryptjs 3.0.3
- **File Storage:** AWS S3 (@aws-sdk/client-s3 3.971.0)
- **CSV Parser:** PapaParse 5.5.3
- **Excel Export:** XLSX 0.18.5
- **PDF Generation:** jsPDF 4.2.1

### **DevOps & Tools**
- **Package Manager:** npm
- **TypeScript:** 5.x
- **Linting:** ESLint 9
- **Analytics:** Vercel Analytics & Speed Insights

---

## 🏗️ Arsitektur Aplikasi

### **1. Layered Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (Next.js Pages, Components, Forms, UI)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     API LAYER                            │
│  (Next.js API Routes: /api/public, /api/admin, /api/kasir) │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                          │
│  (Business Logic, Validation, Promo Calculation)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  REPOSITORY LAYER                        │
│  (Database Queries, Prisma ORM)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER                             │
│  (PostgreSQL Database)                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Overview

### **Prisma 7 Configuration**

Fordza-Web menggunakan **Prisma 7** dengan custom configuration:

**Generator Configuration:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}
```

**Custom Output Path:** `app/generated/prisma` (bukan default `node_modules/.prisma/client`)

**Neon Serverless Adapter:**
```typescript
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter, // Required for Prisma 7 with Neon
  log: ["error", "warn"],
});
```

**Benefits:**
- Serverless-optimized connection pooling
- Better performance with Neon database
- Custom client location for better organization

### **Core Models (16 Total)**

#### **Product Management**
1. **Product** - Data produk utama (cached: price, stock, rating)
2. **ProductDetail** - Detail lengkap produk (deskripsi, material, dll)
3. **ProductVariant** - Varian per warna/material
4. **ProductSku** - SKU per ukuran (unit terkecil yang dijual)
5. **ProductImage** - Gambar produk utama
6. **ProductVariantImage** - Gambar per varian
7. **Category** - Kategori produk
8. **ProductCategory** - Pivot table produk-kategori (many-to-many)
9. **SizeTemplate** - Template ukuran (EU, US, UK, dll)

#### **Sales & Transaction**
10. **Transaction** - Transaksi penjualan
11. **TransactionItem** - Item dalam transaksi (snapshot harga & promo)
12. **CashierShift** - Shift kasir (modal awal/akhir)

#### **Inventory Management**
13. **StockLog** - History stok level produk (cached total)
14. **SkuStockLog** - History stok level SKU (per ukuran)
15. **SkuSalesSummary** - OLAP table untuk dashboard (agregasi harian)

#### **Marketing & CMS**
16. **Promo** - Sistem promo dengan targeting bertingkat
17. **Testimonial** - Review pelanggan
18. **Banner** - Banner homepage

#### **User Management**
19. **Admin** - User admin & kasir

---

## 🔐 Sistem Autentikasi

### **JWT-Based Authentication**

#### **Token Strategy**
- **Access Token:** 15 menit (untuk akses API)
- **Refresh Token:** 7 hari (untuk perpanjangan session)

#### **Token Storage**
- **Access Token:** HTTP-only cookie + localStorage (fallback)
- **Refresh Token:** HTTP-only cookie (secure)

#### **Flow Autentikasi**

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  POST /api/admin/auth/login                   │
     │  { username, password }                       │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                    ┌───────────┴──────────┐
     │                                    │ 1. Verify password   │
     │                                    │ 2. Generate tokens   │
     │                                    │ 3. Set cookies       │
     │                                    └───────────┬──────────┘
     │                                                │
     │  { accessToken, refreshToken, user }          │
     │<──────────────────────────────────────────────┤
     │                                                │
     │  GET /api/admin/products                      │
     │  Authorization: Bearer <accessToken>          │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                    ┌───────────┴──────────┐
     │                                    │ Verify access token  │
     │                                    │ via middleware       │
     │                                    └───────────┬──────────┘
     │                                                │
     │  { products: [...] }                          │
     │<──────────────────────────────────────────────┤
     │                                                │
     │  (Access token expired after 15 min)          │
     │                                                │
     │  POST /api/admin/auth/refresh                 │
     │  { refreshToken }                             │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                    ┌───────────┴──────────┐
     │                                    │ Verify refresh token │
     │                                    │ Generate new access  │
     │                                    └───────────┬──────────┘
     │                                                │
     │  { accessToken }                              │
     │<──────────────────────────────────────────────┤
     │                                                │
```

#### **Protected Routes**
- **Admin:** `/api/admin/*` - Butuh Bearer token + role ADMIN
- **Kasir:** `/api/kasir/*` - Butuh Bearer token + role KASIR/ADMIN
- **Public:** `/api/public/*` - Tanpa autentikasi

#### **Middleware Protection**
File: `middleware.ts`
- Intercept semua request ke `/api/admin/*`
- Verify JWT dari cookie atau Authorization header
- Inject user info ke request headers

---

## 🎯 Struktur API

### **1. Public API** (`/api/public/*`)
**Akses:** Tanpa autentikasi  
**Fungsi:** Customer-facing endpoints

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/public/products` | GET | List produk dengan filter & pagination |
| `/api/public/products/:id` | GET | Detail produk + related products |
| `/api/public/categories` | GET | List kategori aktif |
| `/api/public/banners` | GET | List banner aktif |
| `/api/public/size-templates` | GET | List template ukuran |
| `/api/public/testimonials` | GET | List testimoni |

### **2. Admin API** (`/api/admin/*`)
**Akses:** Bearer token required (role: ADMIN)  
**Fungsi:** CMS & management

| Resource | Endpoints |
|----------|-----------|
| **Auth** | login, logout, refresh, me |
| **Products** | CRUD + bulk import/export + images |
| **Categories** | CRUD |
| **Banners** | CRUD |
| **Testimonials** | CRUD |
| **Size Templates** | CRUD |
| **Variants** | CRUD per product |
| **SKUs** | CRUD per variant |
| **Users** | CRUD (admin & kasir) |
| **Stock** | Logs, bulk update, export |
| **Reports** | Sales summary, items, export |
| **Shifts** | List, detail |
| **Promo** | CRUD |

### **3. Kasir API** (`/api/kasir/*`)
**Akses:** Bearer token required (role: KASIR/ADMIN)  
**Fungsi:** POS operations

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/kasir/products` | GET | List produk untuk POS |
| `/api/kasir/transactions` | POST | Checkout transaksi |
| `/api/kasir/transactions` | GET | History transaksi |
| `/api/kasir/transactions/:id` | GET | Detail transaksi |
| `/api/kasir/transactions/:id` | PATCH | Void transaksi |
| `/api/admin/shifts/open` | POST | Buka shift |
| `/api/admin/shifts/close` | POST | Tutup shift |
| `/api/admin/shifts/current` | GET | Shift aktif |

---

## 💰 Sistem Promo

### **Promo Hierarchy (Priority Order)**

```
1. VARIANT (Highest Priority)
   ↓ (if not found)
2. PRODUCT
   ↓ (if not found)
3. CATEGORY
   ↓ (if not found)
4. GLOBAL (Lowest Priority)
```

### **Promo Types**
- **PERCENTAGE:** Diskon persentase (contoh: 20%)
- **NOMINAL:** Diskon nominal (contoh: Rp 50.000)

### **Promo Targeting**
- **GLOBAL:** Semua produk
- **CATEGORY:** Produk dalam kategori tertentu
- **PRODUCT:** Produk spesifik
- **VARIANT:** Varian spesifik (warna/material)

### **Conditional Promo**
- **minPurchase:** Minimum pembelian untuk aktifkan promo
- Jika `minPurchase > 0`, promo ditampilkan tapi tidak langsung dipotong
- Promo baru aktif saat checkout jika total memenuhi syarat

### **Price Calculation Flow**

```
1. Base Price (dari ProductVariant.basePrice)
2. Comparison Price (harga coret, jika ada)
3. Find Best Promo (hierarchy: VARIANT → PRODUCT → CATEGORY → GLOBAL)
4. Calculate Discount:
   - If PERCENTAGE: discount = basePrice × (value / 100)
   - If NOMINAL: discount = value
5. Final Price = basePrice - discount
6. Total Discount % = ((highestPrice - finalPrice) / highestPrice) × 100
```

### **SKU Price Override**
- Setiap SKU bisa punya `priceOverride` (untuk ukuran bigsize)
- Jika ada `priceOverride`, gunakan sebagai base price SKU tersebut
- Promo tetap diterapkan ke `priceOverride`

---

## 🤖 Sistem Rekomendasi (KNN)

### **K-Nearest Neighbors Algorithm**

File: `lib/knn.ts`

#### **Feature Vectors**
Setiap produk direpresentasikan sebagai vektor dengan dimensi:
- **Gender:** Man, Woman, Unisex
- **ProductType:** Shoes, Sandals, Boots, dll
- **Categories:** Array kategori (Formal, Casual, Sport, dll)
- **Material:** Kulit, Suede, Canvas, dll
- **Price Range:** Bucket harga (0-500k, 500k-1M, >1M)

#### **Distance Calculation**
- **Euclidean Distance** untuk menghitung similarity
- Semakin kecil distance, semakin mirip produk

#### **Recommendation Flow**
```
1. Get current product features
2. Build feature vectors for all products
3. Calculate distance to all other products
4. Sort by distance (ascending)
5. Return K nearest products (default: 4)
6. Filter: same gender, active products only
```

---

## 📦 File Storage (AWS S3)

### **S3 Configuration**
- **Bucket:** Configured via environment variables
- **Region:** Configurable
- **Access:** IAM credentials (Access Key + Secret Key)

### **Upload Flow**
```
1. Client uploads file to Next.js API
2. Server validates file (type, size)
3. Generate unique key: `{folder}/{timestamp}-{uuid}.{ext}`
4. Upload to S3 via AWS SDK
5. Return public URL
6. Save URL + key to database
```

### **Delete Flow**
```
1. Get image key from database
2. Delete from S3 via AWS SDK
3. Delete record from database
```

### **Folder Structure**
```
s3://bucket-name/
├── products/          # Gambar produk utama
├── variants/          # Gambar varian
├── categories/        # Gambar kategori
└── banners/           # Gambar banner
```

---

## 📊 Stock Management

### **Two-Level Stock Tracking**

#### **1. Product Level (Cached)**
- **Field:** `Product.stock`
- **Fungsi:** Total stok semua SKU (untuk display cepat)
- **Update:** Otomatis saat SKU berubah

#### **2. SKU Level (Actual)**
- **Field:** `ProductSku.stock`
- **Fungsi:** Stok per ukuran (unit terkecil)
- **Update:** Manual (opname) atau otomatis (transaksi)

### **Stock Log System**

#### **StockLog (Product Level)**
- Catat perubahan stok total produk
- Type: SALE, VOID, RESTOCK, ADJUSTMENT
- Untuk dashboard & reporting

#### **SkuStockLog (SKU Level)**
- Catat perubahan stok per SKU
- Snapshot: size, color, delta, currentStock
- Untuk audit trail detail

### **Stock Flow**

```
┌─────────────────┐
│   Transaction   │
│   (Checkout)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Decrement SKU  │
│  Stock (-qty)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Create          │
│ SkuStockLog     │
│ (type: SALE)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Recalculate     │
│ Product.stock   │
│ (sum all SKUs)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Create          │
│ StockLog        │
│ (type: SALE)    │
└─────────────────┘
```

---

## 🔄 Transaction Flow

### **Checkout Process**

```
1. Kasir scan/pilih produk
2. Pilih varian (warna)
3. Pilih SKU (ukuran)
4. Tambah ke keranjang
5. Input qty
6. Sistem hitung:
   - Base price (dari variant atau SKU override)
   - Promo discount (jika ada)
   - Final price per item
7. Kasir input total bayar
8. Sistem hitung kembalian
9. Checkout:
   - Generate invoice number
   - Create Transaction record
   - Create TransactionItem records (snapshot harga & promo)
   - Decrement stock (SKU level)
   - Create stock logs
   - Update SkuSalesSummary (OLAP)
10. Print invoice
```

### **Void Transaction**

```
1. Kasir pilih transaksi
2. Input admin PIN (authorization)
3. Verify PIN
4. Update Transaction.status = VOID
5. Restore stock (increment SKU)
6. Create stock logs (type: VOID)
7. Update SkuSalesSummary (decrement)
```

---

## 📈 Reporting & Analytics

### **SkuSalesSummary (OLAP Table)**

**Fungsi:** Pre-agregasi data penjualan harian untuk performa dashboard

**Fields:**
- `date` - Tanggal (00:00:00 WIB)
- `productId`, `skuId` - Relasi produk & SKU
- `productName`, `productCode`, `variantColor`, `skuSize` - Snapshot
- `totalQty` - Total qty terjual
- `totalRevenue` - Total revenue
- `totalOrders` - Jumlah transaksi

**Update:** Otomatis saat checkout & void

**Query:** Dashboard bisa langsung query table ini tanpa aggregate real-time

---

## 🔍 Audit Trail System

### **Audit Fields**

Untuk tracking siapa yang membuat dan mengupdate record penting.

**Models dengan Audit Trail:**
- **Product** - `createdById`, `updatedById`
- **Category** - `createdById`, `updatedById`
- **Promo** - `createdById`, `updatedById`
- **Banner** - `createdById`, `updatedById`

**Implementation:**
```typescript
model Product {
  createdById String? @map("created_by_id")
  updatedById String? @map("updated_by_id")
  
  createdBy Admin? @relation("ProductCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy Admin? @relation("ProductUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
}
```

**Benefits:**
- Track siapa yang buat/edit produk
- Accountability untuk perubahan data
- Audit trail lengkap
- History preserved (onDelete: SetNull)

**Usage:**
```typescript
// Create product
await prisma.product.create({
  data: {
    name: "Product Name",
    createdById: adminId,
    updatedById: adminId,
  }
})

// Update product
await prisma.product.update({
  where: { id },
  data: {
    name: "Updated Name",
    updatedById: adminId, // Track who updated
  }
})
```

---

## 🚀 Performance Optimizations (Updated)

### **1. Database**
- **Indexes:** Pada foreign keys, unique fields, query fields
- **Composite Indexes:** `(kasirId, createdAt)`, `(status, createdAt)`, `(productId, createdAt)`, `(type, createdAt)`
- **Cached Fields:** `Product.price`, `Product.stock`, `Product.avgRating`
- **OLAP Table:** `SkuSalesSummary` untuk dashboard

### **2. API**
- **Pagination:** Semua list endpoints
- **Selective Fields:** Prisma select untuk minimize data transfer
- **Batch Operations:** Bulk import, bulk stock update

### **3. Frontend**
- **TanStack Query:** Caching, deduplication, background refetch
- **Lazy Loading:** Images, components
- **Optimistic Updates:** Instant UI feedback

### **4. Images**
- **S3 CDN:** Fast delivery
- **Compression:** Client-side sebelum upload
- **Lazy Load:** Intersection Observer

---

## 🔒 Security

### **1. Authentication**
- JWT dengan separate secrets (access & refresh)
- Access token expiry: 15 menit (configurable)
- Refresh token expiry: 7 hari (configurable)
- HTTP-only cookies (XSS protection)
- bcrypt untuk password hashing (12 rounds, configurable)
- Automatic secret validation on startup (min 32 chars)

### **2. Authorization**
- Role-based access control (ADMIN, KASIR)
- Proxy protection untuk admin routes
- Admin PIN untuk void transaction

### **3. Rate Limiting**
- In-memory LRU cache (single server)
- Login: 5 attempts/minute per IP
- Refresh: 10 attempts/minute per IP
- PIN verification: 3 attempts/minute per IP
- Configurable limits via environment variables

### **4. Input Validation**
- Zod schema validation di service layer
- Server-side validation (double check)
- SQL injection protection (Prisma ORM)
- Type-safe inputs

### **5. Error Handling**
- Custom error classes (AppError, ValidationError, NotFoundError, etc.)
- Centralized error handler
- Prisma error mapping (P2002, P2025, P2003)
- Consistent error responses

### **6. Audit Trail**
- Request ID tracking (x-request-id)
- User ID injection (x-user-id, x-user-role)
- createdById/updatedById fields
- Structured logging dengan Pino

### **7. File Upload**
- File type validation
- File size limit
- Unique filename (prevent overwrite)
- S3 secure storage

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### **Adaptive UI**
- Admin dashboard: Desktop-first
- POS: Tablet-optimized
- Public pages: Mobile-first

---

## 🧪 Testing Strategy

### **Manual Testing**
- Postman collections untuk API
- Browser testing untuk UI
- Cross-device testing

### **Future: Automated Testing**
- Unit tests (Vitest)
- Integration tests (Playwright)
- E2E tests (Cypress)

---

## 📚 Documentation

- **ARCHITECTURE.md** - Arsitektur sistem (this file)
- **DATABASE.md** - Database schema detail
- **API_REFERENCE.md** - API endpoints documentation
- **FOLDER_STRUCTURE.md** - Codebase structure
- **GETTING_STARTED.md** - Setup & installation
- **ADMIN_GUIDE.md** - Admin dashboard guide
- **KASIR_GUIDE.md** - POS system guide
- **FEATURES.md** - Feature documentation
- **UI_SYSTEM.md** - Design system & components
- **DEPLOYMENT.md** - Deployment guide

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
