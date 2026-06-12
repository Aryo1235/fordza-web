# Struktur Folder Fordza-Web

## 📂 Overview

Fordza-Web menggunakan **Next.js 16 App Router** dengan struktur folder yang terorganisir berdasarkan fitur dan layer arsitektur.

```
fordza-web/
├── app/                    # Next.js App Router (routes & pages)
│   ├── generated/          # Generated files
│   │   └── prisma/         # Prisma client (custom output)
│   ├── (public)/           # Public pages
│   ├── (admin)/            # Admin dashboard
│   ├── (kasir)/            # POS system
│   └── api/                # API routes
├── backend/                # Business logic layer
├── features/               # Feature modules (domain-driven)
├── lib/                    # Utilities & helpers
├── components/             # Reusable UI components
├── prisma/                 # Database schema & migrations
├── actions/                # Server actions
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
├── fordza-docs/            # Project documentation
└── scripts/                # Utility scripts
```

---

## 📁 Struktur Detail

### **1. `/app` - Next.js App Router**

Folder utama untuk routing dan pages. Menggunakan **file-based routing** Next.js 16.

```
app/
├── (public)/               # Public-facing pages (customer)
│   ├── layout.tsx          # Layout untuk halaman publik
│   ├── page.tsx            # Homepage (/)
│   ├── products/           # Halaman produk
│   │   ├── page.tsx        # List produk (/products)
│   │   └── [id]/           # Detail produk (/products/:id)
│   │       └── page.tsx
│   ├── categories/         # Halaman kategori
│   │   └── page.tsx        # List kategori (/categories)
│   ├── about/              # Halaman tentang
│   │   └── page.tsx        # About page (/about)
│   └── testimonials/       # Halaman testimoni
│       └── page.tsx        # List testimoni (/testimonials)
│
├── (admin)/                # Admin dashboard (protected)
│   ├── layout.tsx          # Layout admin (sidebar + header)
│   ├── login/              # Login page
│   │   └── page.tsx        # Admin login (/login)
│   └── dashboard/          # Dashboard pages
│       ├── page.tsx        # Dashboard home (/dashboard)
│       ├── layout.tsx      # Dashboard layout
│       ├── products/       # Manajemen produk
│       │   ├── page.tsx    # List produk
│       │   ├── new/        # Tambah produk baru
│       │   │   └── page.tsx
│       │   ├── [id]/       # Edit produk
│       │   │   ├── page.tsx
│       │   │   └── detail/ # Detail produk admin
│       │   │       └── page.tsx
│       │   └── bulk-import/ # Bulk import CSV
│       │       └── page.tsx
│       ├── categories/     # Manajemen kategori
│       │   ├── page.tsx
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── banners/        # Manajemen banner
│       │   └── page.tsx
│       ├── testimonials/   # Manajemen testimoni
│       │   └── page.tsx
│       ├── users/          # Manajemen user (admin & kasir)
│       │   └── page.tsx
│       ├── stock/          # Stok opname
│       │   └── page.tsx
│       ├── stock-history/  # History stok
│       │   └── page.tsx
│       ├── reports/        # Laporan penjualan
│       │   └── page.tsx
│       ├── shifts/         # Manajemen shift
│       │   └── page.tsx
│       ├── promo/          # Manajemen promo
│       │   └── page.tsx
│       ├── size-templates/ # Template ukuran
│       │   └── page.tsx
│       └── transactions/   # History transaksi
│           ├── page.tsx
│           └── [id]/       # Detail transaksi
│               └── page.tsx
│
├── (kasir)/                # POS system (protected)
│   ├── layout.tsx          # Layout kasir (sidebar + shift blocker)
│   ├── pos/                # POS interface
│   │   └── page.tsx        # Main POS page (/pos)
│   ├── riwayat/            # History transaksi kasir
│   │   ├── page.tsx        # List transaksi (/riwayat)
│   │   └── [id]/           # Detail transaksi
│   │       └── page.tsx
│   └── cetak-ulang/        # Cetak ulang invoice
│       └── page.tsx        # Reprint page (/cetak-ulang)
│
├── api/                    # API Routes (REST)
│   ├── public/             # Public API (no auth)
│   │   ├── products/
│   │   │   ├── route.ts    # GET /api/public/products
│   │   │   └── [id]/
│   │   │       └── route.ts # GET /api/public/products/:id
│   │   ├── categories/
│   │   │   └── route.ts    # GET /api/public/categories
│   │   ├── banners/
│   │   │   └── route.ts    # GET /api/public/banners
│   │   ├── size-templates/
│   │   │   └── route.ts    # GET /api/public/size-templates
│   │   └── testimonials/
│   │       └── route.ts    # GET /api/public/testimonials
│   │
│   ├── admin/              # Admin API (auth required)
│   │   ├── auth/           # Authentication
│   │   │   ├── login/
│   │   │   │   └── route.ts # POST /api/admin/auth/login
│   │   │   ├── logout/
│   │   │   │   └── route.ts # POST /api/admin/auth/logout
│   │   │   ├── refresh/
│   │   │   │   └── route.ts # POST /api/admin/auth/refresh
│   │   │   └── me/
│   │   │       └── route.ts # GET /api/admin/auth/me
│   │   ├── products/
│   │   │   ├── route.ts    # GET, POST /api/admin/products
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts # GET, PUT, DELETE /api/admin/products/:id
│   │   │   │   ├── images/
│   │   │   │   │   ├── route.ts # POST (add image)
│   │   │   │   │   └── [imageId]/
│   │   │   │   │       └── route.ts # DELETE (remove image)
│   │   │   │   └── variants/
│   │   │   │       └── route.ts # GET, POST (variants per product)
│   │   │   ├── bulk-import/
│   │   │   │   └── route.ts # POST (CSV import)
│   │   │   └── export/
│   │   │       └── route.ts # GET (export Excel)
│   │   ├── categories/
│   │   │   ├── route.ts    # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts # GET, PUT, DELETE
│   │   ├── banners/
│   │   │   ├── route.ts    # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts # GET, PUT, DELETE
│   │   ├── testimonials/
│   │   │   ├── route.ts    # GET, POST
│   │   │   ├── [id]/
│   │   │   │   └── route.ts # PUT, DELETE
│   │   │   └── products/
│   │   │       └── route.ts # GET (lightweight product selection)
│   │   ├── size-templates/
│   │   │   ├── route.ts    # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts # GET, PUT, DELETE
│   │   ├── variants/
│   │   │   ├── route.ts    # GET (search)
│   │   │   ├── [variantId]/
│   │   │   │   ├── route.ts # PATCH, DELETE
│   │   │   │   └── skus/
│   │   │   │       └── route.ts # POST (add SKU)
│   │   ├── skus/
│   │   │   └── [skuId]/
│   │   │       └── route.ts # PATCH, DELETE
│   │   ├── users/
│   │   │   ├── route.ts    # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts # PATCH, DELETE
│   │   ├── cashiers/
│   │   │   └── route.ts    # GET (list kasir)
│   │   ├── stock/
│   │   │   ├── logs/
│   │   │   │   ├── route.ts # GET (product logs)
│   │   │   │   ├── sku/
│   │   │   │   │   └── route.ts # GET (SKU logs)
│   │   │   │   └── export/
│   │   │   │       └── route.ts # GET (export logs)
│   │   │   └── opname/
│   │   │       ├── route.ts # GET, PATCH (stock opname)
│   │   │       └── export/
│   │   │           └── route.ts # GET (export opname)
│   │   ├── reports/
│   │   │   ├── route.ts    # GET (summary)
│   │   │   ├── items/
│   │   │   │   └── route.ts # GET (items report)
│   │   │   └── export/
│   │   │       ├── summary/
│   │   │       │   └── route.ts # GET (export summary)
│   │   │       └── items/
│   │   │           └── route.ts # GET (export items)
│   │   ├── shifts/
│   │   │   ├── open/
│   │   │   │   └── route.ts # POST (buka shift)
│   │   │   ├── close/
│   │   │   │   └── route.ts # POST (tutup shift)
│   │   │   └── current/
│   │   │       └── route.ts # GET (shift aktif)
│   │   ├── transactions/
│   │   │   ├── route.ts    # GET (list)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts # GET (detail)
│   │   │   └── export/
│   │   │       └── route.ts # GET (export Excel)
│   │   ├── promo/
│   │   │   ├── route.ts    # GET, POST
│   │   │   ├── [id]/
│   │   │   │   └── route.ts # GET, PATCH, DELETE
│   │   │   ├── categories/
│   │   │   │   └── route.ts # GET (lightweight category selection)
│   │   │   └── products/
│   │   │       └── route.ts # GET (lightweight product selection)
│   │   └── dashboard/
│   │       └── route.ts    # GET (dashboard stats)
│   │
│   ├── kasir/              # Kasir API (auth required)
│   │   ├── auth/
│   │   │   └── verify-pin/
│   │   │       └── route.ts # POST (verify admin PIN)
│   │   ├── products/
│   │   │   └── route.ts    # GET (products for POS)
│   │   └── transactions/
│   │       ├── route.ts    # POST (checkout), GET (history)
│   │       └── [id]/
│   │           └── route.ts # GET (detail), PATCH (void)
│   │
│   └── recommend/          # Recommendation API
│       └── [id]/
│           └── route.ts    # GET /api/recommend/:id (KNN)
│
├── layout.tsx              # Root layout (global)
└── globals.css             # Global styles
```

**Penjelasan:**
- **(public)**, **(admin)**, **(kasir)** = Route groups (tidak muncul di URL)
- **layout.tsx** = Shared layout untuk child routes
- **page.tsx** = Actual page component
- **route.ts** = API route handler

---

### **2. `/backend` - Business Logic Layer**

Layer untuk business logic, terpisah dari API routes.

```
backend/
├── repositories/           # Data access layer (Prisma queries)
│   ├── products.repo.ts    # Product CRUD + filtering + promo logic
│   ├── category.repo.ts    # Category CRUD
│   ├── banner.repo.ts      # Banner CRUD
│   ├── testimonial.repo.ts # Testimonial CRUD + rating calculation
│   ├── admin.repo.ts       # Admin/User CRUD + PIN verification
│   ├── transaction.repo.ts # Transaction CRUD + stock decrement
│   ├── shift.repo.ts       # Shift management
│   ├── promo.repo.ts       # Promo CRUD + active promo fetching
│   ├── stock.repo.ts       # Stock logs + bulk update
│   ├── variants.repo.ts    # Variant search
│   ├── size-template.repo.ts # Size template CRUD
│   └── dashboard.repo.ts   # Dashboard stats queries
│
├── services/               # Business logic layer
│   ├── products.service.ts # Product business logic
│   ├── category.service.ts # Category business logic
│   ├── banner.service.ts   # Banner business logic
│   ├── testimonial.service.ts # Testimonial + rating logic
│   ├── admin.service.ts    # User management + PIN verification
│   ├── transaction.service.ts # Checkout + void + invoice generation
│   ├── shift.service.ts    # Shift open/close logic
│   ├── promo.service.ts    # Promo validation + application
│   ├── report.service.ts   # Sales report generation
│   ├── recommendation.service.ts # KNN recommendation
│   ├── size-template.service.ts # Size template logic
│   └── dashboard.service.ts # Dashboard stats aggregation
│
└── scripts/                # Maintenance scripts
    └── backfill-summaries.ts # Backfill SkuSalesSummary data
```

**Penjelasan:**
- **Repositories:** Pure database queries (Prisma)
- **Services:** Business logic + validation + orchestration
- API routes hanya call services, tidak langsung ke repositories

---

### **3. `/features` - Feature Modules**

Modular structure berdasarkan domain/fitur. Setiap feature punya:
- **api.ts** - API client functions (axios)
- **hooks.ts** - React Query hooks
- **types.ts** - TypeScript types
- **schemas.ts** - Zod validation schemas (optional)
- **components/** - Feature-specific components (optional)

```
features/
├── auth/                   # Authentication feature
│   ├── api.ts              # login, logout, refresh, getMe
│   ├── hooks.ts            # useLogin, useLogout, useMe
│   ├── types.ts            # LoginRequest, AuthResponse, User
│   └── index.ts            # Barrel export
│
├── products/               # Products feature
│   ├── api.ts              # CRUD, bulk import, images
│   ├── hooks.ts            # useProducts, useProduct, useCreateProduct, dll
│   ├── types.ts            # Product, ProductFilters, ProductFormData
│   ├── schemas.ts          # productSchema (Zod)
│   ├── components/         # Product-specific components
│   │   ├── ProductCard.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductGridWrapper.tsx
│   │   ├── ProductGridSkeleton.tsx
│   │   ├── ProductTestimonials.tsx
│   │   └── RelatedProducts.tsx
│   ├── utils/
│   │   └── csv-parser.ts   # CSV parsing logic
│   └── index.ts
│
├── categories/             # Categories feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   ├── schemas.ts
│   ├── components/
│   │   ├── CategoryForm.tsx
│   │   └── PublicCategoryCard.tsx
│   └── index.ts
│
├── banners/                # Banners feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   └── index.ts
│
├── testimonials/           # Testimonials feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   ├── components/
│   │   ├── TestimonialCard.tsx
│   │   └── TestimonialOverview.tsx
│   └── index.ts
│
├── variants/               # Variants & SKUs feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   ├── schemas.ts
│   ├── components/
│   │   ├── VariantBuilder.tsx  # Inline variant builder (create product)
│   │   └── VariantManager.tsx  # Full variant manager (edit product)
│   └── index.ts
│
├── kasir/                  # POS feature
│   ├── api.ts              # checkout, getProducts, voidTransaction
│   ├── hooks.ts            # useKasirProducts, useCheckout, dll
│   ├── types.ts            # CartItem, CheckoutRequest, Invoice
│   ├── components/
│   │   ├── ProductCard.tsx     # POS product card
│   │   ├── CartDrawer.tsx      # Shopping cart drawer
│   │   ├── InvoiceModal.tsx    # Invoice preview & print
│   │   ├── AdminPinModal.tsx   # Admin PIN input
│   │   ├── VoidTransactionDialog.tsx
│   │   ├── QuickStockCheck.tsx
│   │   └── KasirSidebar.tsx
│   └── index.ts
│
├── shifts/                 # Shift management feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   ├── components/
│   │   ├── ShiftBlockerModal.tsx
│   │   └── CloseShiftModal.tsx
│   └── index.ts
│
├── promo/                  # Promo feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   └── index.ts
│
├── landing-page/           # Homepage feature
│   ├── api.ts
│   ├── hooks.ts
│   ├── types.ts
│   ├── HeroSection.tsx
│   ├── BannerSection.tsx
│   ├── ProductsSection.tsx
│   ├── ProductSectionRow.tsx
│   └── ProductCard.tsx
│
└── admin/                  # Admin-specific features
    ├── users/              # User management
    │   ├── api.ts
    │   ├── hooks.ts
    │   └── index.ts
    ├── stock/              # Stock management
    │   ├── api.ts
    │   ├── hooks.ts
    │   └── index.ts
    ├── reports/            # Reports
    │   ├── api.ts
    │   ├── hooks.ts
    │   └── index.ts
    ├── dashboard/          # Dashboard stats
    │   ├── api.ts
    │   ├── hooks.ts
    │   └── index.ts
    └── size-templates/     # Size templates
        ├── api.ts
        ├── hooks.ts
        ├── types.ts
        └── index.ts
```

**Penjelasan:**
- Setiap feature = self-contained module
- Import dari feature: `import { useProducts } from '@/features/products'`
- Mudah di-maintain dan di-test

---

### **4. `/lib` - Utilities & Helpers**

Library dan utility functions yang digunakan di seluruh aplikasi.

```
lib/
├── prisma.ts               # Prisma client singleton (with Neon adapter)
├── auth.ts                 # JWT functions (sign, verify, hash password)
├── s3.ts                   # AWS S3 client configuration
├── api.ts                  # Axios instance + interceptors
├── zod-schemas.ts          # Shared Zod schemas
├── knn.ts                  # K-Nearest Neighbors algorithm
├── utils.ts                # General utilities (cn, formatRupiah, dll)
└── download.ts             # File download helper
```

**Penjelasan:**
- **prisma.ts:** Singleton Prisma client dengan Neon adapter (Prisma 7)
- **auth.ts:** JWT sign/verify, bcrypt hash/compare
- **s3.ts:** AWS S3 client config
- **api.ts:** Axios instance dengan base URL + auth interceptor
- **knn.ts:** Recommendation algorithm
- **utils.ts:** Helper functions (classnames merge, format currency, dll)

---

### **5. `/components` - Reusable UI Components**

Komponen UI yang reusable di seluruh aplikasi.

```
components/
├── ui/                     # Shadcn/UI components (primitives)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   ├── tooltip.tsx
│   ├── popover.tsx
│   ├── calendar.tsx
│   ├── command.tsx
│   ├── sidebar.tsx
│   ├── skeleton.tsx
│   ├── progress.tsx
│   ├── separator.tsx
│   ├── checkbox.tsx
│   ├── switch.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── slider.tsx
│   ├── scroll-area.tsx
│   ├── navigation-menu.tsx
│   └── date-picker.tsx
│
├── shared/                 # Custom shared components
│   ├── ImageUpload.tsx     # Image upload dengan preview
│   ├── RichTextEditor.tsx  # WYSIWYG editor (Tiptap)
│   ├── DataTable.tsx       # Table dengan sorting & pagination
│   ├── Pagination.tsx      # Pagination controls
│   ├── PublicPagination.tsx # Pagination untuk public pages
│   ├── ConfirmDialog.tsx   # Confirmation dialog
│   ├── StatusBadge.tsx     # Status badge
│   ├── MultiSelectComboBox.tsx # Multi-select dropdown
│   ├── Providers.tsx       # React Query provider
│   ├── animations.tsx      # Framer Motion animations
│   │   ├── FadeUpSection
│   │   ├── StaggerList
│   │   ├── ParallaxLayer
│   │   └── ScaleOnHover
│   └── premium-animations.tsx # Advanced animations
│       ├── Tilt3D
│       ├── Magnetic
│       └── SmoothScroll
│
├── layout/                 # Layout components
│   ├── admin/              # Admin layout
│   │   ├── Sidebar.tsx     # Admin sidebar
│   │   ├── Header.tsx      # Admin header
│   │   └── PageHeader.tsx  # Page header dengan breadcrumb
│   └── public/             # Public layout
│       └── PublicNavbar.tsx # Public navbar
│
└── products/               # Product-specific components (legacy)
    └── ProductCardSkeleton.tsx
```

**Penjelasan:**
- **ui/**: Primitives dari Shadcn/UI (copy-paste, customizable)
- **shared/**: Custom components yang reusable
- **layout/**: Layout components (sidebar, navbar, header)

---

### **6. `/prisma` - Database**

Database schema, migrations, dan seed scripts.

```
prisma/
├── schema.prisma           # Database schema (19 models)
├── seed.ts                 # Seed script (admin + size templates)
├── seed-products.ts        # Seed products (sample data)
├── clear-data.ts           # Clear all data script
└── migrations/             # Migration history (auto-generated)
    └── ...
```

**Penjelasan:**
- **schema.prisma:** Single source of truth untuk database structure
  - Generator output: `../app/generated/prisma` (custom path)
  - Datasource: PostgreSQL
- **seed.ts:** Seed admin default + size templates
- **migrations/:** Auto-generated oleh Prisma

---

### **7. `/actions` - Server Actions**

Server actions untuk operasi yang butuh server-side execution.

```
actions/
└── upload.ts               # S3 upload & delete functions
    ├── uploadFileToS3()
    └── deleteFileFromS3()
```

**Penjelasan:**
- Server actions untuk upload file ke S3
- Bisa dipanggil dari client components

---

### **8. `/hooks` - Custom React Hooks**

Custom hooks yang reusable.

```
hooks/
├── use-mobile.ts           # useIsMobile() - Detect mobile device
└── useDebounce.ts          # useDebounce() - Debounce value
```

---

### **9. `/public` - Static Assets**

Static files yang di-serve langsung oleh Next.js.

```
public/
├── images/                 # Static images
├── icons/                  # Icons
└── fonts/                  # Custom fonts (if any)
```

---

### **10. `/scripts` - Utility Scripts**

Scripts untuk maintenance, testing, atau data migration.

```
scripts/
├── check-logs.ts           # Check stock logs
├── check-logs.js           # JS version
└── migrate-prices-to-gimmick.ts # Data migration script
```

---

### **11. `/fordza-docs` - Documentation**

Project documentation (Markdown files).

```
fordza-docs/
├── ARCHITECTURE.md         # System architecture
├── DATABASE.md             # Database schema
├── API_REFERENCE.md        # API documentation
├── FOLDER_STRUCTURE.md     # This file
├── GETTING_STARTED.md      # Setup guide
├── ADMIN_GUIDE.md          # Admin guide
├── KASIR_GUIDE.md          # POS guide
├── FEATURES.md             # Features documentation
├── UI_SYSTEM.md            # Design system
└── DEPLOYMENT.md           # Deployment guide
```

---

## 🔧 Configuration Files

```
fordza-web/
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
├── eslint.config.mjs       # ESLint configuration
├── middleware.ts           # Next.js middleware (auth protection)
└── README.md               # Project README
```

---

## 📦 Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage:**
```typescript
// ✅ Good (absolute import)
import { prisma } from '@/lib/prisma'
import { useProducts } from '@/features/products'
import { Button } from '@/components/ui/button'

// ❌ Avoid (relative import)
import { prisma } from '../../../lib/prisma'
```

---

## 🎯 Best Practices

### **1. Feature-First Organization**
- Group by feature, bukan by type
- Setiap feature = self-contained module
- Mudah di-maintain dan di-scale

### **2. Separation of Concerns**
- **API Routes:** Hanya handle HTTP request/response
- **Services:** Business logic
- **Repositories:** Database queries
- **Components:** UI rendering

### **3. Colocation**
- Taruh file dekat dengan yang menggunakannya
- Feature-specific components di dalam feature folder
- Shared components di `/components`

### **4. Naming Conventions**
- **Files:** kebab-case (`product-card.tsx`)
- **Components:** PascalCase (`ProductCard`)
- **Functions:** camelCase (`getProducts`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

### **5. Barrel Exports**
- Setiap feature punya `index.ts` untuk export
- Simplify imports: `import { useProducts } from '@/features/products'`

---

## 📚 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API endpoints documentation
- **[DATABASE.md](./DATABASE.md)** - Database schema details

---

**Last Updated:** 2026-06-05  
**Version:** 1.0.0

