# Panduan Sistem: Cara Kerja Mesin Promo & Diskon Fordza Web

Dokumen ini menjelaskan secara lengkap alur kerja, logika prioritas, aturan bisnis, dan perhitungan mesin promo (promo engine) pada sistem Fordza Web POS (Desktop & Mobile) serta Backend Checkout.

---

## 1. Hirarki & Prioritas Seleksi Promo (Paling Krusial)

Sistem Fordza menerapkan **Model Promo Eksklusif Terseleksi per SKU/Variant** untuk mencegah terjadinya kebocoran margin keuntungan toko (*Discount Overflow*). Setiap produk atau varian yang dimasukkan ke keranjang belanja hanya boleh menggunakan **satu promo terbaik yang paling spesifik**.

Ketika mencari promo aktif untuk sebuah item keranjang, sistem mengecek kecocokan dari tingkat yang **paling spesifik** hingga yang **paling umum**:

```
┌─────────────────────────────────────────────────────────┐
│                    HIRARKI PROMO                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Prioritas 1] VARIANT (Warna & Ukuran Spesifik)        │
│                ▲                                        │
│                │ (Jika tidak ditemukan, turun ke...)    │
│  [Prioritas 2] PRODUCT (Seluruh Varian Model Tersebut)  │
│                ▲                                        │
│                │ (Jika tidak ditemukan, turun ke...)    │
│  [Prioritas 3] CATEGORY (Seluruh Kategori Produk)       │
│                ▲                                        │
│                │ (Jika tidak ditemukan, turun ke...)    │
│  [Prioritas 4] GLOBAL (Berlaku untuk Seluruh Toko)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Aturan Seleksi:
* Jika suatu varian sepatu memiliki **Promo Varian** yang aktif, maka **Promo Global** otomatis diabaikan untuk sepatu tersebut.
* Proses ini memastikan toko terlindungi dari penumpukan diskon (tidak bisa menumpuk Diskon Varian + Diskon Produk + Diskon Global secara liar pada satu barang).

---

## 2. Klasifikasi Jenis Promo & Rumus Perhitungan

Mesin promo Fordza mendukung dua jenis perhitungan diskon utama:

### A. Promo Langsung (Direct Promo)
Diskon yang langsung memotong harga satuan barang tanpa ada syarat minimum belanja.
* **Kriteria:** Bidang `minPurchase` bernilai `0` atau dikosongkan.
* **Tipe Nilai:**
  * **PERCENTAGE (%):** `Harga Satuan * Persentase / 100 * Qty`
  * **NOMINAL (Rp / FIXED):** `Nilai Nominal Diskon * Qty`
* **Sifat UI:** Diskon langsung memotong harga barang di baris item keranjang (harga dicoret di POS).
* **Efek Qty:** Berlaku **kelipatan kuantitas** (makin banyak dibeli, makin besar diskonnya).

### 2. Klasifikasi Jenis Promo & Rumus Perhitungan

Mesin promo Fordza mendukung dua jenis perhitungan diskon utama:

### A. Promo Langsung (Direct Promo)
Diskon yang langsung memotong harga satuan barang tanpa ada syarat minimum belanja.
* **Kriteria:** Bidang `minPurchase` bernilai `0` atau dikosongkan.
* **Tipe Nilai:**
  * **PERCENTAGE (%):** `Harga Satuan * Persentase / 100 * Qty`
  * **NOMINAL (Rp / FIXED):** `Nilai Nominal Diskon * Qty`
* **Sifat UI:** Diskon langsung memotong harga barang di baris item keranjang (harga dicoret di POS).
* **Efek Qty:** Berlaku **kelipatan kuantitas** (makin banyak dibeli, makin besar diskonnya).

### B. Promo Bersyarat (Conditional Promo / Flat Discount)
Diskon nominal tetap yang hanya aktif ketika total belanja keranjang mencapai syarat belanja minimum tertentu.
* **Kriteria:** Bidang `minPurchase` bernilai lebih dari `0` (`minPurchase > 0`) **DAN** `PromoType = NOMINAL` (berlaku untuk level VARIANT, PRODUCT, CATEGORY, maupun GLOBAL).
* **Aturan Anti-Leakage (Penting):** 
  * Untuk mencegah kebocoran keuangan, **diskon flat bersyarat nominal hanya diterapkan SEKALI per ID Promo (Event Promo)** untuk seluruh transaksi.
  * Sistem tidak menghitung diskon ini secara mandiri per baris barang. Jika pembeli membeli 3 ukuran/varian berbeda yang terikat pada promo bersyarat yang sama, potongan diskon tetap **Flat** sekali saja (misal Rp 10.000), bukan berlipat ganda menjadi Rp 30.000.
* **Rumus Distribusi (Prorasi Proporsional):**
  Diskon flat bersyarat tersebut akan didistribusikan secara proporsional ke semua item yang menggunakan promo tersebut dengan rumus:
  $$\text{Diskon Item} = \frac{\text{Subtotal Item}}{\text{Total Subtotal Kelompok Promo}} \times \text{Nominal Diskon Flat}$$
  *Sisa pembulatan rupiah akan otomatis diserap oleh item terakhir di dalam kelompok.*
* **Sifat UI:** 
  * Di baris item keranjang, harga barang tetap normal atau menampilkan diskon proporsional yang telah dibagi rata.
  * Tag promo di bawah nama barang menunjukkan status: 
    * 🟢 `(Aktif - Potongan Flat di Total)` jika subtotal kelompok memenuhi syarat.
    * ⚪ `(Min. Rp [Syarat] - Belum Terpenuhi)` jika belum memenuhi syarat.
  * Potongan diskon akan dikelompokkan secara terpisah di panel ringkasan pembayaran bagian bawah sebagai baris **Promo Bersyarat** untuk transparansi akuntansi kasir.

---

## 3. Alur Perhitungan Transaksi di POS & Backend (Best Practices)

Urutan perhitungan total harga akhir transaksi dirancang secara paralel antara POS Frontend dan Backend Checkout menggunakan 5 Tahap:

```
  [ Harga Asli Barang ]
           │
           ▼  (Tahap 1: Hitung diskon langsung level item - non-conditional & percentage)
  [ Harga Bersih Item ]
           │
           ▼  (Tahap 2: Kumpulkan Subtotal Belanja Riil Keranjang)
  [ Subtotal Belanja ]
           │
           ▼  (Tahap 3: Kelompokkan item per ID Promo Bersyarat, hitung & proratakan diskon flat)
  [ Kurangkan Diskon Bersyarat Item-Level ]
           │
           ▼  (Tahap 4: Hitung & proratakan diskon GLOBAL NOMINAL ke item yang eligible)
  [ Kurangkan Diskon Global ]
           │
           ▼  
  [ TOTAL AKHIR PEMBAYARAN ]
```

### Golden Rules (Keamanan Finansial):
1. **Pengelompokan (Grouping) per ID Promo:** Semua kalkulasi promo bersyarat nominal dikelompokkan terlebih dahulu berdasarkan ID Promonya untuk memastikan tidak ada dobel diskon yang tidak sah pada produk/varian yang berbeda.
2. **Subtotal Riil:** Evaluasi batas minimal belanja (`minPurchase`) menggunakan subtotal dari barang-barang yang masuk kualifikasi promo tersebut, memastikan transaksi yang terjadi benar-benar sah sebelum diskon diberikan.

---

## 4. Simulasi Contoh Kasus Nyata

### Kasus A: Beli Varian/Ukuran Berbeda dengan Promo Bersyarat Nominal yang Sama
* **Promo Aktif:**
  * **Promo ID 99:** "Promo Sepatu Boots" (Diskon Flat Rp 10.000, syarat minimal belanja Rp 200.000). Target: Kategori Sepatu Boots.
* **Pembelian:**
  * Pelanggan membeli **1 Sepatu Boots Hitam Size 38** (Rp 150.000) dan **1 Sepatu Boots Hitam Size 39** (Rp 150.000).
* **Hasil Perhitungan:**
  * Sistem mengelompokkan kedua barang karena menggunakan **Promo ID 99** yang sama.
  * Total subtotal kelompok = Rp 300.000 (Lolos syarat minimal belanja Rp 200.000).
  * Diskon flat sebesar **Rp 10.000** diterapkan sekali untuk kelompok tersebut.
  * Pembagian Prorata:
    * Sepatu Boots Hitam Size 38 mendapat diskon: $\frac{150.000}{300.000} \times 10.000 = \text{Rp 5.000}$.
    * Sepatu Boots Hitam Size 39 mendapat diskon: $\frac{150.000}{300.000} \times 10.000 = \text{Rp 5.000}$.
  * **Total Akhir Transaksi:** Rp 290.000 (Potongan pas Rp 10.000, margin toko aman).

### Kasus B: Promo Bersyarat POS Reguler
* **Promo Aktif:**
  * Promo Bersyarat: Potongan Rp 2.000 jika belanja minimal Rp 20.000.
* **Pembelian:**
  * Pelanggan membeli **2 Sepatu Formal** seharga @Rp 10.000.
* **Hasil Perhitungan:**
  * Subtotal belanja = Rp 20.000 (Memenuhi syarat minimal belanja Rp 20.000).
  * Potongan Flat = Rp 2.000 (Muncul di rincian ringkasan bawah sebagai **Promo Bersyarat**).
  * **Total Pembayaran Akhir:** **Rp 18.000**.
