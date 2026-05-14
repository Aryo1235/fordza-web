# Features Documentation - Fordza-Web

## 📋 Overview

Fordza-Web adalah sistem e-commerce dan POS terintegrasi dengan fitur-fitur lengkap untuk mengelola toko sepatu online dan offline.

---

## 🎯 Core Features

### **1. Multi-Variant Product Management**

Sistem produk dengan support varian kompleks (warna, ukuran, harga berbeda).

**Hierarchy:**
```
Product (Oxford Classic)
├─ Variant: Black
│  ├─ SKU: Size 40 (Rp 850.000)
│  ├─ SKU: Size 41 (Rp 850.000)
│  └─ SKU: Size 46 (Rp 950.000) ← Bigsize
└─ Variant: Brown
   ├─ SKU: Size 40 (Rp 850.000)
   └─ SKU: Size 41 (Rp 850.000)
```

**Key Features:**
- **Multiple Variants** - Warna, material, dll
- **SKU per Size** - Stok & harga per ukuran
- **Price Override** - Harga berbeda untuk bigsize
- **Multiple Images** - Gambar produk + gambar per varian
- **Rich Description** - WYSIWYG editor untuk deskripsi

**Use Cases:**
- Produk dengan banyak warna
- Harga bigsize lebih mahal
- Stok tracking per ukuran

---

### **2. Advanced Stock Management**

Sistem tracking stok 2 level dengan history lengkap.

**Two-Level Tracking:**

#### **Level 1: Product (Cached Total)**
- Total stok semua SKU
- Untuk display cepat di katalog
- Auto-update saat SKU berubah

#### **Level 2: SKU (Actual Stock)**
- Stok per ukuran
- Unit terkecil yang dijual
- Real-time tracking

**Stock Logs:**
- **StockLog** - History level produk
- **SkuStockLog** - History level SKU
- **Types:** SALE, VOID, RESTOCK, ADJUSTMENT
- **Audit Trail:** Siapa, kapan, berapa

**Features:**
- **Bulk Stock Update** - Update ratusan SKU sekaligus
- **Stock Opname** - Stok opname dengan UI friendly
- **Low Stock Alert** - Dashboard alert stok menipis
- **Export Logs** - Export history ke Excel

**Use Cases:**
- Audit stok
- Tracking perubahan stok
- Analisis stok per ukuran
- Restock planning

---

### **3. Hierarchical Promo System**

Sistem promo dengan targeting bertingkat dan conditional promo.

**Promo Hierarchy (Priority Order):**
```
1. VARIANT (Highest)
   ↓
2. PRODUCT
   ↓
3. CATEGORY
   ↓
4. GLOBAL (Lowest)
```

**Promo Types:**
- **PERCENTAGE** - Diskon persentase (contoh: 20%)
- **NOMINAL** - Diskon nominal (contoh: Rp 50.000)

**Targeting:**
- **GLOBAL** - Semua produk
- **CATEGORY** - Produk dalam kategori tertentu
- **PRODUCT** - Produk spesifik
- **VARIANT** - Varian spesifik (warna)

**Conditional Promo:**
- **minPurchase** - Minimum pembelian untuk aktifkan promo
- Contoh: "Diskon Rp 50.000 Min. Belanja Rp 500.000"

**Features:**
- **Auto-Apply** - Promo otomatis terapply di katalog & POS
- **Periode Promo** - Set start & end date
- **Promo Stacking** - Hanya 1 promo per produk (highest priority)
- **Snapshot** - Nama promo tersimpan di invoice

**Use Cases:**
- Flash sale kategori tertentu
- Diskon produk slow-moving
- Promo conditional untuk boost sales
- Diskon varian tertentu (clearance)

---

### **4. KNN Product Recommendation**

Algoritma K-Nearest Neighbors untuk rekomendasi produk.

**Feature Vectors:**
- Gender (Man, Woman, Unisex)
- Product Type (Shoes, Sandals, Boots)
- Categories (Formal, Casual, Sport)
- Material (Kulit, Suede, Canvas)
- Price Range (bucket)

**How It Works:**
1. Extract features dari produk saat ini
2. Build vectors untuk semua produk
3. Calculate Euclidean distance
4. Sort by distance (ascending)
5. Return K nearest products (default: 4)

**Features:**
- **Smart Filtering** - Same gender, active products only
- **Distance-Based** - Semakin kecil distance, semakin mirip
- **Configurable K** - Jumlah rekomendasi bisa diatur

**Use Cases:**
- "Produk Serupa" di detail page
- Cross-selling
- Upselling

---

### **5. Point of Sale (POS) System**

Sistem kasir lengkap untuk transaksi offline.

**Features:**

#### **Shift Management**
- **Open Shift** - Buka shift dengan modal awal
- **Close Shift** - Tutup shift dengan rekap penjualan
- **Shift Blocker** - Wajib buka shift sebelum transaksi
- **Selisih Tracking** - Track selisih uang (surplus/deficit)

#### **Transaction Flow**
- **Product Search** - Search produk real-time
- **Variant Selection** - Pilih warna & ukuran
- **Cart Management** - Tambah, edit, hapus item
- **Promo Auto-Apply** - Promo otomatis terapply
- **Multiple Payment** - Support berbagai metode bayar
- **Change Calculation** - Auto-calculate kembalian

#### **Invoice**
- **Auto-Generate** - Invoice number otomatis
- **Thermal Print** - Format untuk thermal printer 58mm/80mm
- **Reprint** - Cetak ulang invoice kapan saja
- **Customer Info** - Simpan nama & no. telepon (CRM lite)

#### **Void Transaction**
- **Admin PIN** - Butuh PIN admin untuk void
- **Stock Restore** - Stok otomatis dikembalikan
- **Audit Trail** - Alasan void tersimpan

**Use Cases:**
- Transaksi toko offline
- Kasir multiple shift
- Tracking penjualan per kasir

---

### **6. Sales Reporting & Analytics**

Dashboard & laporan penjualan lengkap.

**Reports:**

#### **Sales Summary**
- Total revenue
- Total transaksi
- Total items terjual
- Avg transaction value
- Chart penjualan harian

#### **Sales by Items**
- Produk terlaris
- Ukuran terlaris
- Revenue per produk
- Qty terjual per SKU

#### **Filters:**
- Date range
- Kasir
- Produk
- Status (PAID/VOID)

**Features:**
- **OLAP Table** - Pre-agregasi untuk performa
- **Export Excel** - Export semua report ke Excel
- **Real-time** - Data real-time dari transaksi
- **Multi-Sheet Export** - Summary + Items + Transactions

**Use Cases:**
- Analisis penjualan
- Restock planning
- Performance tracking per kasir
- Identifikasi produk slow-moving

---

### **7. Bulk Operations**

Operasi massal untuk efisiensi.

**Features:**

#### **Bulk Import Products (CSV)**
- Upload CSV dengan ratusan produk
- Smart lookup kategori (by name or ID)
- Smart lookup size template (by name or ID)
- Validation & error reporting
- Preview sebelum import

#### **Bulk Stock Update**
- Update stok ratusan SKU sekaligus
- Highlight perubahan
- Batch save
- Auto-create stock logs

#### **Bulk Export**
- Export produk ke Excel
- Export transaksi ke Excel
- Export stock logs ke Excel
- Include semua relasi (variants, SKUs)

**Use Cases:**
- Migrasi data dari sistem lama
- Stok opname besar-besaran
- Backup data
- Analisis eksternal (Excel)

---

### **8. Image Management (AWS S3)**

Upload & manage gambar dengan AWS S3.

**Features:**
- **Multiple Upload** - Upload banyak gambar sekaligus
- **Drag & Drop** - UI friendly
- **Client Compression** - Compress sebelum upload
- **S3 Storage** - Scalable & reliable
- **CDN Ready** - Fast delivery
- **Auto-Delete** - Hapus dari S3 saat delete record

**Supported:**
- Product images (multiple)
- Variant images (multiple)
- Category images (single)
- Banner images (single)

**Limits:**
- Max file size: 5MB
- Max files per upload: 10
- Allowed types: JPG, PNG, WEBP

**Use Cases:**
- Upload foto produk dari berbagai angle
- Upload foto varian per warna
- Manage banner homepage

---

### **9. User & Role Management**

Sistem user dengan role-based access control.

**Roles:**
- **ADMIN** - Full access (CMS + POS)
- **KASIR** - POS only

**Features:**
- **User CRUD** - Create, read, update, delete user
- **Password Hashing** - bcrypt untuk security
- **PIN System** - 4 digit PIN untuk void transaction
- **Soft Delete** - User tidak benar-benar dihapus
- **Audit Trail** - Track siapa yang transaksi

**Use Cases:**
- Multiple kasir
- Tracking per kasir
- Security layer untuk void

---

### **10. Category Management**

Organize produk dengan kategori.

**Features:**
- **Multiple Categories** - 1 produk bisa punya banyak kategori
- **Category Image** - Gambar untuk card kategori
- **Order Management** - Drag & drop untuk ubah urutan
- **Soft Delete** - Kategori tidak benar-benar dihapus

**Use Cases:**
- Organize produk by type (Formal, Casual, Sport)
- Filter produk di katalog
- Landing page per kategori

---

### **11. Testimonial & Rating System**

Review produk dengan auto-calculate rating.

**Features:**
- **Star Rating** - 1-5 bintang
- **Text Review** - Isi testimoni
- **Auto-Calculate** - Rating produk auto-update
- **Cached Rating** - Product.avgRating untuk performa

**Formula:**
```
avgRating = SUM(rating) / COUNT(testimonials)
totalReviews = COUNT(testimonials)
```

**Use Cases:**
- Social proof
- Product credibility
- Customer feedback

---

### **12. Size Template System**

Template ukuran untuk panduan customer.

**Features:**
- **Multiple Templates** - EU, US, UK, dll
- **Flexible Sizes** - Array ukuran custom
- **Type-Based** - Template per tipe produk (shoes, sandals)
- **Reusable** - 1 template untuk banyak produk

**Use Cases:**
- Panduan ukuran di detail page
- Standardisasi ukuran
- Reduce return karena salah ukuran

---

### **13. Banner Management**

Manage banner homepage untuk promo.

**Features:**
- **Multiple Banners** - Carousel homepage
- **Link URL** - Banner bisa link ke page tertentu
- **Active/Inactive** - Toggle visibility
- **S3 Storage** - Gambar di S3

**Use Cases:**
- Promo homepage
- New arrival announcement
- Event banner

---

### **14. Transaction History**

History transaksi lengkap dengan snapshot.

**Features:**
- **Immutable** - Data transaksi tidak berubah
- **Snapshot** - Harga, promo, nama produk tersimpan
- **Invoice Number** - Unique per transaksi
- **Customer Info** - Nama & no. telepon (optional)
- **Void Support** - Bisa void dengan admin PIN

**Use Cases:**
- Audit trail
- Customer service
- Reprint invoice
- Analisis penjualan

---

### **15. Dashboard Analytics**

Dashboard admin dengan metrics penting.

**Metrics:**
- Revenue hari ini
- Transaksi hari ini
- Total produk
- Stok menipis
- Chart penjualan 7 hari
- Transaksi terbaru

**Features:**
- **Real-time** - Data real-time
- **Visual** - Chart & graphs
- **Quick Access** - Link ke detail

**Use Cases:**
- Monitor performa toko
- Quick overview
- Decision making

---

## 🚀 Upcoming Features

### **Planned:**
- [ ] Customer loyalty program
- [ ] Wishlist
- [ ] Product comparison
- [ ] Advanced analytics (cohort, retention)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Multi-warehouse support
- [ ] Barcode scanner integration
- [ ] Payment gateway integration
- [ ] Shipping integration

---

## 📚 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API documentation
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Admin guide
- **[KASIR_GUIDE.md](./KASIR_GUIDE.md)** - POS guide
- **[DATABASE.md](./DATABASE.md)** - Database schema

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
