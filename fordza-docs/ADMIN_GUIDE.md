# Admin Dashboard Guide - Fordza-Web

## 📋 Overview

Admin Dashboard adalah sistem CMS (Content Management System) untuk mengelola seluruh aspek toko online dan POS Fordza-Web.

**URL:** `http://localhost:3000/dashboard`

---

## 🔐 Login Admin

### **1. Akses Halaman Login**

Buka: `http://localhost:3000/login`

### **2. Masukkan Credentials**

**Default Admin:**
- Username: `admin`
- Password: `fordza2026`

### **3. Klik "Login"**

Setelah berhasil, kamu akan diarahkan ke Dashboard.

---

## 🏠 Dashboard Home

### **Statistik Utama**

Dashboard menampilkan:
- **Revenue Hari Ini** - Total penjualan hari ini
- **Transaksi Hari Ini** - Jumlah transaksi
- **Total Produk** - Jumlah produk aktif
- **Stok Menipis** - Produk dengan stok < 10

### **Chart Penjualan**

Grafik penjualan 7 hari terakhir.

### **Transaksi Terbaru**

List 10 transaksi terakhir dengan status.

---

## 📦 Manajemen Produk

### **List Produk**

**Menu:** Dashboard → Products

**Fitur:**
- Search produk (nama/kode)
- Filter status (Active/Inactive)
- Pagination
- Export Excel

**Kolom Tabel:**
- Kode Produk
- Nama
- Harga (terendah)
- Stok Total
- Varian
- Status
- Actions (Edit, Delete)

---

### **Tambah Produk Baru**

**Menu:** Dashboard → Products → New Product

#### **Step 1: Informasi Dasar**

| Field | Required | Description |
|-------|----------|-------------|
| Kode Produk | ✅ | Kode unik (contoh: FRD-001) |
| Nama Produk | ✅ | Nama lengkap produk |
| Deskripsi Singkat | ✅ | Deskripsi untuk card produk |
| Tipe Produk | ✅ | Shoes, Sandals, Boots, dll |
| Gender | ✅ | Man, Woman, Unisex |
| Kategori | ✅ | Pilih 1 atau lebih kategori |

#### **Step 2: Detail Produk**

| Field | Required | Description |
|-------|----------|-------------|
| Deskripsi Lengkap | ❌ | Rich text editor (HTML) |
| Material | ❌ | Bahan produk (Kulit, Suede, dll) |
| Outsole | ❌ | Jenis sol luar |
| Insole | ❌ | Jenis sol dalam |
| Closure Type | ❌ | Tipe penutup (Lace-up, Slip-on) |
| Origin | ❌ | Negara asal |
| Size Template | ❌ | Template ukuran (EU, US, UK) |
| Notes | ❌ | Catatan tambahan |

#### **Step 3: Gambar Produk**

- Upload gambar utama produk (max 10 files)
- Format: JPG, PNG, WEBP
- Max size: 5MB per file
- Drag & drop atau klik untuk upload

#### **Step 4: Varian & SKU**

**Tambah Varian:**
1. Klik "Add Variant"
2. Isi:
   - **Warna** (contoh: Black, Brown)
   - **Harga Jual** (base price)
   - **Harga Coret** (optional, untuk gimmick)
   - **Upload Gambar Varian** (optional)

3. Tambah SKU (ukuran):
   - Klik "Add Size"
   - Isi:
     - **Ukuran** (contoh: 40, 41, 42)
     - **Stok**
     - **Harga Override** (optional, untuk bigsize)

**Contoh:**
```
Varian: Black
├─ Harga Jual: Rp 850.000
├─ Harga Coret: -
└─ SKU:
   ├─ Ukuran 40: Stok 10, Harga: Rp 850.000
   ├─ Ukuran 41: Stok 15, Harga: Rp 850.000
   └─ Ukuran 46: Stok 5, Harga: Rp 950.000 (bigsize)
```

#### **Step 5: Status Flags**

- ☑️ **Popular** - Tampil di section "Popular"
- ☑️ **Bestseller** - Tampil di section "Bestseller"
- ☑️ **New** - Tampil di section "New Arrivals"
- ☑️ **Active** - Produk aktif (tampil di katalog)

#### **Step 6: Submit**

Klik **"Create Product"** untuk menyimpan.

**Proses:**
1. Upload gambar ke S3
2. Generate variant codes
3. Create product + variants + SKUs
4. Create stock logs (initial stock)

---

### **Edit Produk**

**Menu:** Dashboard → Products → [Pilih Produk] → Edit

**Yang Bisa Diubah:**
- Semua field informasi dasar
- Detail produk
- Tambah/hapus gambar
- Status flags

**Yang TIDAK Bisa Diubah Langsung:**
- Varian & SKU (gunakan Variant Manager)

**Cara Edit Varian:**
1. Klik tab "Variants"
2. Gunakan Variant Manager untuk:
   - Edit harga varian
   - Tambah/hapus SKU
   - Edit stok SKU
   - Upload/hapus gambar varian

---

### **Hapus Produk**

**Menu:** Dashboard → Products → [Pilih Produk] → Delete

**Catatan:**
- Soft delete (data tidak benar-benar dihapus)
- Produk akan di-set `isActive=false` dan `deletedAt=now`
- Semua varian dan SKU juga di-soft delete
- Tidak tampil di katalog publik
- Masih bisa dilihat di admin (untuk history)

---

### **Bulk Import Produk (CSV)**

**Menu:** Dashboard → Products → Bulk Import

#### **Step 1: Download Template**

Klik "Download Template" untuk dapat file CSV template.

#### **Step 2: Isi Data**

Buka CSV dengan Excel/Google Sheets, isi data:

| Column | Required | Example |
|--------|----------|---------|
| productCode | ✅ | FRD-002 |
| name | ✅ | Derby Brown |
| shortDescription | ✅ | Sepatu derby kulit |
| productType | ✅ | shoes |
| gender | ✅ | Man |
| categoryIds | ✅ | Formal,Casual (atau ID) |
| material | ❌ | Kulit Asli |
| variants | ✅ | JSON array (lihat template) |

**Format Variants:**
```json
[{"color":"Brown","basePrice":780000,"skus":[{"size":"40","stock":10}]}]
```

#### **Step 3: Upload CSV**

1. Klik "Choose File"
2. Pilih CSV file
3. Klik "Upload & Preview"
4. Review data yang akan diimport
5. Klik "Import Products"

**Hasil:**
- Success: Jumlah produk berhasil diimport
- Failed: Jumlah produk gagal + error messages

**Catatan:**
- Produk yang diimport akan di-set `isActive=false` (draft)
- Review dulu sebelum aktifkan
- Kategori bisa pakai nama atau ID
- Size template bisa pakai nama atau ID

---

### **Export Produk ke Excel**

**Menu:** Dashboard → Products → Export

**Fitur:**
- Export semua produk atau hasil search
- Format: Excel (.xlsx)
- Include: Produk, varian, SKU, stok

**Kolom Export:**
- Product Code
- Name
- Price
- Stock
- Variants (JSON)
- Categories
- Status
- Created At

---

## 📂 Manajemen Kategori

### **List Kategori**

**Menu:** Dashboard → Categories

**Fitur:**
- List semua kategori
- Drag & drop untuk ubah urutan
- Edit/Delete kategori

---

### **Tambah Kategori**

**Menu:** Dashboard → Categories → New Category

**Form:**
| Field | Required | Description |
|-------|----------|-------------|
| Nama | ✅ | Nama kategori |
| Deskripsi Singkat | ❌ | Deskripsi kategori |
| Gambar | ✅ | Upload gambar (max 5MB) |
| Urutan | ❌ | Urutan tampilan (default: 0) |
| Status | ✅ | Active/Inactive |

**Submit:** Klik "Create Category"

---

### **Edit Kategori**

**Menu:** Dashboard → Categories → [Pilih Kategori] → Edit

**Yang Bisa Diubah:**
- Nama
- Deskripsi
- Gambar (upload baru akan replace yang lama)
- Urutan
- Status

---

### **Hapus Kategori**

**Menu:** Dashboard → Categories → [Pilih Kategori] → Delete

**Catatan:**
- Soft delete
- Produk yang pakai kategori ini tidak akan terhapus
- Relasi produk-kategori akan tetap ada (untuk history)

---

## 🎨 Manajemen Banner

### **List Banner**

**Menu:** Dashboard → Banners

**Fitur:**
- List semua banner
- Preview gambar
- Edit/Delete banner

---

### **Tambah Banner**

**Menu:** Dashboard → Banners → New Banner

**Form:**
| Field | Required | Description |
|-------|----------|-------------|
| Judul | ❌ | Judul banner (optional) |
| Gambar | ✅ | Upload gambar (max 5MB) |
| Link URL | ❌ | URL tujuan saat banner diklik |
| Status | ✅ | Active/Inactive |

**Rekomendasi Ukuran Gambar:**
- Desktop: 1920x600px
- Mobile: 800x600px
- Format: JPG, PNG, WEBP

---

### **Edit Banner**

**Menu:** Dashboard → Banners → [Pilih Banner] → Edit

---

### **Hapus Banner**

**Menu:** Dashboard → Banners → [Pilih Banner] → Delete

**Catatan:**
- Hard delete (data benar-benar dihapus)
- Gambar di S3 juga akan dihapus

---

## ⭐ Manajemen Testimoni

### **List Testimoni**

**Menu:** Dashboard → Testimonials

**Fitur:**
- List semua testimoni
- Filter by product
- Edit/Delete testimoni

---

### **Tambah Testimoni**

**Menu:** Dashboard → Testimonials → New Testimonial

**Form:**
| Field | Required | Description |
|-------|----------|-------------|
| Produk | ✅ | Pilih produk |
| Nama Customer | ✅ | Nama pemberi testimoni |
| Rating | ✅ | 1-5 bintang |
| Konten | ✅ | Isi testimoni |
| Status | ✅ | Active/Inactive |

**Submit:** Klik "Create Testimonial"

**Proses:**
1. Create testimoni
2. Auto-recalculate product rating
3. Update `Product.avgRating` dan `Product.totalReviews`

---

### **Edit Testimoni**

**Menu:** Dashboard → Testimonials → [Pilih Testimoni] → Edit

---

### **Hapus Testimoni**

**Menu:** Dashboard → Testimonials → [Pilih Testimoni] → Delete

**Proses:**
1. Delete testimoni
2. Auto-recalculate product rating

---

## 👥 Manajemen User

### **List User**

**Menu:** Dashboard → Users

**Fitur:**
- List semua user (admin & kasir)
- Filter by role
- Edit/Delete user

**Kolom Tabel:**
- Username
- Nama
- Role (ADMIN/KASIR)
- PIN (untuk kasir)
- Status
- Actions

---

### **Tambah User**

**Menu:** Dashboard → Users → New User

**Form:**
| Field | Required | Description |
|-------|----------|-------------|
| Username | ✅ | Username untuk login |
| Password | ✅ | Password (min 6 karakter) |
| Nama | ✅ | Nama lengkap |
| Role | ✅ | ADMIN atau KASIR |
| PIN | ❌ | 4 digit PIN (untuk void transaction) |

**Submit:** Klik "Create User"

**Catatan:**
- Username harus unik
- Password akan di-hash dengan bcrypt
- PIN optional tapi recommended untuk admin

---

### **Edit User**

**Menu:** Dashboard → Users → [Pilih User] → Edit

**Yang Bisa Diubah:**
- Nama
- Password (kosongkan jika tidak ingin ubah)
- Role
- PIN

---

### **Hapus User**

**Menu:** Dashboard → Users → [Pilih User] → Delete

**Catatan:**
- Soft delete
- User tidak bisa login lagi
- History transaksi tetap ada

---


## 📊 Stok Opname

### **Bulk Update Stok**

**Menu:** Dashboard → Stock

**Fungsi:** Update stok banyak produk/SKU sekaligus.

#### **Cara Penggunaan:**

1. **Search Produk**
   - Ketik nama/kode produk di search box
   - Produk akan muncul dengan semua varian & SKU

2. **Edit Stok**
   - Klik pada kolom stok
   - Ubah angka stok
   - Stok yang berubah akan ditandai (highlight)

3. **Submit**
   - Klik "Save Changes"
   - Konfirmasi perubahan
   - Sistem akan:
     - Update stok di database
     - Create stock logs (type: ADJUSTMENT)
     - Recalculate total stok produk

**Contoh:**
```
Product: Oxford Classic Black
├─ Varian: Black
│  ├─ SKU 40: 10 → 15 (tambah 5)
│  ├─ SKU 41: 15 → 10 (kurang 5)
│  └─ SKU 46: 5 → 5 (tidak berubah)
└─ Total Stok: 30 → 30
```

**Catatan:**
- Perubahan langsung tercatat di stock logs
- Operator ID otomatis dari user yang login
- Bisa update ratusan SKU sekaligus

---

## 📜 History Stok

### Stock Logs (Product Level) & SKU Stock Logs

**Menu:** Dashboard → Stock History

**Fitur:**
- List semua perubahan stok produk (Ringkasan Produk) maupun detail per SKU (Detail Varian & Ukuran).
- **Filter Bar Komprehensif:**
  - **Pencarian** produk, kode, atau catatan (dengan tombol hapus pencarian `X`).
  - **Dari Tanggal** (DatePicker awal periode) dan **Sampai Tanggal** (DatePicker akhir periode).
  - **Tipe Aktivitas** (SALE, RESTOCK, VOID, ADJUSTMENT).
  - Tombol **Reset** dengan ikon `RotateCcw` untuk mengembalikan semua filter ke kondisi awal.
- **Ekspor Laporan:** Mendukung ekspor ke Excel & PDF yang secara otomatis menyaring data sesuai dengan rentang periode dan filter aktif.

---

## 📈 Laporan Penjualan

**Menu:** Dashboard → Reports

Halaman ini menyajikan dua bagian analisis utama untuk memantau performa bisnis:

### **1. Ringkasan Penjualan (Summary)**
- **Metrik Utama:** Total Pendapatan (lunas/PAID), Jumlah Transaksi, dan Rata-rata Nilai Order per pelanggan.
- **Tren Harian:** Grafik garis (Line Chart) untuk memantau fluktuasi pendapatan harian.
- **Produk Terlaris:** Daftar 5 produk terpopuler berdasarkan unit penjualan tertinggi.
- **Export Ringkasan:** Menyediakan tombol ekspor laporan ringkasan ke format Excel dan PDF.

### **2. Tabel Penjualan Item**
Menyajikan analisis penjualan detail per kombinasi SKU produk dan metode pembayaran.
- **Data Source:** Dihitung real-time dari data transaksi dan rincian item belanja.
- **Filter & Urutan:**
  - Rentang Tanggal (Dari s.d Sampai Tanggal)
  - Pencarian Nama/Kode produk
  - Minimal Qty terjual
  - Pengurutan (Qty terbesar, Revenue terbesar, Nama A-Z)
- **Kolom Tabel:**
  | Column | Description |
  |--------|-------------|
  | # | Nomor urut |
  | Kode Produk | Kode unik produk |
  | Kode Variant | Kode unik varian warna produk |
  | Produk | Nama produk |
  | Varian | Detail Warna dan Ukuran |
  | Metode | Metode pembayaran yang digunakan (`CASH`, `QRIS`, `DEBIT`) |
  | Qty Terjual | Total kuantitas produk terjual |
  | Harga Satuan | Harga satuan item saat transaksi |
  | Total Diskon | Total diskon/potongan harga yang diberikan |
  | Revenue | Total pendapatan bersih setelah dikurangi diskon |
- **Export Laporan:**
  - Mendukung ekspor data tabel penjualan item ke format Excel dan PDF.
  - Laporan ekspor menyertakan **baris TOTAL** untuk total Qty dan Revenue terkumpul di bagian bawah dokumen.

---

### **Export Reports**

**Format:** Excel (.xlsx)

**Sheets:**
1. **Summary** - Metrics & chart data
2. **Items** - Detail per produk/SKU
3. **Transactions** - List transaksi

**Cara Export:**
1. Set filter (tanggal, kasir, dll)
2. Klik "Export to Excel"
3. File akan otomatis download

---

## 🕐 Manajemen Shift

### **List Shift**

**Menu:** Dashboard → Shifts

**Fitur:**
- List semua shift (open & closed)
- Filter by:
  - Kasir
  - Status (OPEN/CLOSED)
  - Tanggal
- Detail shift

**Kolom Tabel:**
| Column | Description |
|--------|-------------|
| Kasir | Nama kasir |
| Start Time | Waktu buka shift |
| End Time | Waktu tutup shift |
| Modal Awal | Starting cash |
| Expected Ending | Expected ending cash |
| Actual Ending | Actual ending cash |
| Selisih | Difference (actual - expected) |
| Status | OPEN/CLOSED |

---

### **Detail Shift**

**Menu:** Dashboard → Shifts → [Pilih Shift]

**Informasi:**
- Kasir
- Waktu buka/tutup
- Modal awal/akhir
- Selisih
- Notes
- List transaksi dalam shift

**Metrics:**
- Total transaksi
- Total revenue
- Total items terjual

---

## 💰 Manajemen Promo

### **List Promo**

**Menu:** Dashboard → Promo

**Fitur:**
- List semua promo
- Filter by:
  - Status (Active/Inactive)
  - Tipe (PERCENTAGE/NOMINAL)
  - Target (GLOBAL/CATEGORY/PRODUCT/VARIANT)
- Edit/Delete promo

---

### **Tambah Promo**

**Menu:** Dashboard → Promo → New Promo

**Form:**

#### **1. Informasi Dasar**
| Field | Required | Description |
|-------|----------|-------------|
| Nama Promo | ✅ | Nama promo (contoh: "Diskon 20% Sepatu Formal") |
| Deskripsi | ❌ | Deskripsi promo |
| Tipe | ✅ | PERCENTAGE atau NOMINAL |
| Value | ✅ | Nilai diskon (20 untuk 20%, atau 50000 untuk Rp 50.000) |

#### **2. Target Promo**
| Target | Description | Example |
|--------|-------------|---------|
| GLOBAL | Semua produk | Diskon 10% semua produk |
| CATEGORY | Produk dalam kategori tertentu | Diskon 20% kategori Formal |
| PRODUCT | Produk spesifik | Diskon 15% Oxford Classic |
| VARIANT | Varian spesifik | Diskon 25% varian Black |

**Pilih Target:**
- Jika CATEGORY: Pilih kategori
- Jika PRODUCT: Pilih produk
- Jika VARIANT: Pilih varian

#### **3. Conditional Promo**
| Field | Required | Description |
|-------|----------|-------------|
| Min Purchase | ❌ | Minimum pembelian (Rp) untuk aktifkan promo |

**Contoh:**
- Min Purchase = 0: Promo langsung aktif
- Min Purchase = 500000: Promo aktif jika total belanja ≥ Rp 500.000

#### **4. Periode Promo**
| Field | Required | Description |
|-------|----------|-------------|
| Start Date | ✅ | Tanggal mulai promo |
| End Date | ✅ | Tanggal akhir promo |

#### **5. Status**
- ☑️ **Active** - Promo aktif

**Submit:** Klik "Create Promo"

---

### **Cara Kerja Promo**

#### **Hierarchy (Priority Order):**
```
1. VARIANT (Highest Priority)
   ↓ (if not found)
2. PRODUCT
   ↓ (if not found)
3. CATEGORY
   ↓ (if not found)
4. GLOBAL (Lowest Priority)
```

**Contoh:**
```
Produk: Oxford Classic Black
├─ Varian: Black
│  └─ Promo VARIANT: Diskon 25% (APPLIED ✅)
├─ Promo PRODUCT: Diskon 15% (IGNORED)
├─ Promo CATEGORY (Formal): Diskon 20% (IGNORED)
└─ Promo GLOBAL: Diskon 10% (IGNORED)

Result: Diskon 25% (dari promo VARIANT)
```

#### **Conditional Promo:**
- Jika `minPurchase > 0`, promo ditampilkan tapi tidak langsung dipotong
- Promo baru aktif saat checkout jika total memenuhi syarat
- Di katalog akan ada badge "Diskon hingga X% (Min. Belanja Rp Y)"

---

### **Edit Promo**

**Menu:** Dashboard → Promo → [Pilih Promo] → Edit

**Yang Bisa Diubah:**
- Semua field
- Target promo (bisa ganti kategori/produk)
- Periode promo

---

### **Hapus Promo**

**Menu:** Dashboard → Promo → [Pilih Promo] → Delete

**Catatan:**
- Hard delete
- Promo yang sudah dipakai di transaksi tetap tercatat (snapshot)

---

## 📏 Manajemen Size Template

### **List Size Template**

**Menu:** Dashboard → Size Templates

**Fitur:**
- List semua template ukuran
- Edit/Delete template

---

### **Tambah Size Template**

**Menu:** Dashboard → Size Templates → New Template

**Form:**
| Field | Required | Description |
|-------|----------|-------------|
| Nama | ✅ | Nama template (contoh: "EU Size") |
| Tipe | ✅ | shoes, sandals, boots, dll |
| Sizes | ✅ | Array ukuran (comma-separated) |

**Contoh:**
```
Nama: EU Size
Tipe: shoes
Sizes: 39,40,41,42,43,44,45
```

**Submit:** Klik "Create Template"

---

### **Edit Size Template**

**Menu:** Dashboard → Size Templates → [Pilih Template] → Edit

---

### **Hapus Size Template**

**Menu:** Dashboard → Size Templates → [Pilih Template] → Delete

**Catatan:**
- Tidak bisa hapus template yang sedang dipakai produk
- Soft delete

---

## 📊 Manajemen Transaksi

### List Transaksi

**Menu:** Dashboard → Transactions

**Fitur:**
- List semua transaksi yang dilakukan oleh seluruh kasir.
- **Filter Bar Komprehensif** (Menyelaraskan visual & fitur dengan menu kasir):
  - Pencarian nomor invoice (dengan tombol clear `X`).
  - **Dari Tanggal** dan **Sampai Tanggal** (DatePicker).
  - **Pilih Kasir** (Dropdown dinamis berisi daftar semua kasir).
  - Tombol **Reset** dengan ikon `RotateCcw` untuk membatalkan seluruh filter.
- **Penyajian Metode Pembayaran:**
  - Kolom **Metode** menampilkan badge khusus sesuai metode yang digunakan saat transaksi: `DEBIT` (badge biru), `QRIS` (badge ungu), atau `CASH` (badge stone).
- **Export Laporan (Excel & PDF):**
  - Menyertakan kolom **Metode Pembayaran** pada rincian ringkasan maupun detail item.
  - Dokumen PDF menyertakan baris **GRAND TOTAL** di bawah tabel untuk total Qty dan nominal Revenue terkumpul.

---

### **Detail Transaksi**

**Menu:** Dashboard → Transactions → [Pilih Transaksi]

**Informasi:**

#### **Header:**
- Invoice Number
- Tanggal & Waktu
- Kasir
- Status
- Shift ID

#### **Customer Info:**
- Nama Customer (optional)
- No. Telepon (optional)

#### **Items:**
| Column | Description |
|--------|-------------|
| Produk | Nama produk |
| Varian | Warna |
| Ukuran | Size |
| Qty | Quantity |
| Harga Satuan | Price at sale |
| Diskon | Discount amount |
| Subtotal | Qty × (Price - Discount) |

#### **Payment:**
- Subtotal
- Total Diskon
- **Total Bayar**
- Uang Diterima
- Kembalian

#### **Notes:**
- Catatan transaksi (jika ada)
- Cancel reason (jika VOID)

---

### **Export Transaksi**

**Format:** Excel (.xlsx)

**Kolom:**
- Invoice No
- Tanggal
- Kasir
- Customer Name
- Customer Phone
- Items (JSON)
- Total Price
- Amount Paid
- Change
- Status
- Notes

---

## 🔧 Tips & Best Practices

### **Manajemen Produk**

1. **Gunakan Kode Produk Konsisten**
   - Format: `FRD-XXX` (XXX = nomor urut)
   - Mudah di-track dan di-search

2. **Upload Gambar Berkualitas**
   - Resolusi minimal: 800x800px
   - Background putih/netral
   - Multiple angles (depan, samping, detail)

3. **Isi Detail Lengkap**
   - Material, outsole, insole
   - Deskripsi lengkap dengan HTML formatting
   - Size template untuk panduan ukuran

4. **Gunakan Varian dengan Benar**
   - 1 varian = 1 warna/material
   - Jangan buat varian untuk ukuran (gunakan SKU)

5. **Set Harga Bigsize**
   - Gunakan `priceOverride` di SKU untuk ukuran besar
   - Contoh: Ukuran 46-48 lebih mahal Rp 100.000

### **Manajemen Stok**

1. **Lakukan Stok Opname Rutin**
   - Minimal 1x per bulan
   - Cocokkan dengan stok fisik

2. **Monitor Stok Menipis**
   - Dashboard menampilkan produk stok < 10
   - Restock sebelum habis

3. **Cek Stock Logs**
   - Audit trail lengkap
   - Tracking siapa yang ubah stok

### **Manajemen Promo**

1. **Gunakan Hierarchy dengan Bijak**
   - Promo VARIANT untuk diskon spesial warna tertentu
   - Promo CATEGORY untuk diskon kategori
   - Promo GLOBAL untuk diskon semua produk

2. **Set Periode Promo**
   - Jangan lupa set end date
   - Promo expired otomatis tidak aktif

3. **Conditional Promo untuk Boost Sales**
   - Min purchase Rp 500.000 → Diskon Rp 50.000
   - Encourage customer belanja lebih banyak

### **Manajemen User**

1. **Buat User Kasir Terpisah**
   - Jangan pakai admin untuk kasir
   - Mudah tracking siapa yang transaksi

2. **Set PIN untuk Admin**
   - Untuk void transaction
   - Security layer tambahan

3. **Ganti Password Default**
   - Setelah setup, ganti password admin default
   - Gunakan password kuat

---

## 🚨 Troubleshooting

### **Produk Tidak Muncul di Katalog**

**Cek:**
1. Apakah `isActive = true`?
2. Apakah ada varian aktif?
3. Apakah ada SKU dengan stok > 0?

### **Gambar Tidak Muncul**

**Cek:**
1. Apakah S3 bucket public?
2. Apakah CORS sudah di-setup?
3. Apakah URL gambar valid?

### **Promo Tidak Terapply**

**Cek:**
1. Apakah promo `isActive = true`?
2. Apakah tanggal sekarang dalam periode promo?
3. Apakah target promo sudah benar?
4. Apakah ada promo dengan priority lebih tinggi?

### **Stok Tidak Sinkron**

**Solusi:**
1. Cek stock logs untuk tracking perubahan
2. Lakukan stok opname manual
3. Recalculate total stok produk

---

## 📚 Related Documentation

- **[API_REFERENCE.md](./API_REFERENCE.md)** - API endpoints untuk integrasi
- **[KASIR_GUIDE.md](./KASIR_GUIDE.md)** - Panduan sistem POS
- **[FEATURES.md](./FEATURES.md)** - Feature overview
- **[DATABASE.md](./DATABASE.md)** - Database schema

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
