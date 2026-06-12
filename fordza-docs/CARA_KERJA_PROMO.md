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

### B. Promo Bersyarat (Conditional Promo / Flat Discount)
Diskon nominal tetap yang hanya aktif ketika total belanja keranjang mencapai syarat belanja minimum tertentu.
* **Kriteria:** Bidang `minPurchase` bernilai lebih dari `0` (`minPurchase > 0`) **DAN** `PromoType = NOMINAL`.
* **Rumus Perhitungan:** `Nilai Nominal Diskon` (Flat / Hanya dipotong sekali saja).
* **Sifat UI:** 
  * Di baris item keranjang, harga barang **tetap normal** (tidak dicoret) agar kasir tidak bingung.
  * Tag promo di bawah nama barang menunjukkan status: 
    * 🟢 `(Aktif - Potongan Flat di Total)` jika subtotal memenuhi syarat.
    * ⚪ `(Min. Rp [Syarat] - Belum Terpenuhi)` jika belum memenuhi syarat.
  * Potongan diskon baru akan muncul di panel ringkasan pembayaran bagian bawah sebagai baris **Promo Bersyarat**.
* **Efek Qty:** **Tidak berlaku kelipatan kuantitas** (Flat discount sekali saja per transaksi).

---

## 3. Alur Perhitungan Transaksi di POS & Backend (Best Practices)

Urutan perhitungan total harga akhir transaksi dirancang dengan sangat presisi dan aman secara akuntansi ritel:

```
  [ Harga Asli Barang ]
           │
           ▼  (Tahap 1: Kurangkan diskon produk per item jika ada)
  [ Harga Bersih Item ]
           │
           ▼  (Tahap 2: Akumulasikan Qty ke Subtotal Keranjang)
  [ Subtotal Belanja Riil ]
           │
           ▼  (Tahap 3: Uji apakah Subtotal Riil >= Syarat Minimal Belanja)
  [ Terapkan Potongan Flat Global ]
           │
           ▼  
  [ TOTAL AKHIR PEMBAYARAN ]
```

### Golden Rules (Keamanan Finansial):
1. Pengujian batas minimal belanja (`minPurchase`) selalu menggunakan nilai **Subtotal setelah dipotong diskon produk per item**. 
2. Hal ini memastikan pelanggan benar-benar membelanjakan nominal uang riil di atas batas minimum sebelum berhak menerima potongan flat bersyarat tambahan.

---

## 4. Simulasi Contoh Kasus Nyata

### Kasus A: Keranjang Campur & Proteksi Margin
* **Promo Aktif:**
  1. Promo Spesifik Varian: Diskon Rp 25.000 khusus **Sepatu Formal Hitam** (`basePrice` Rp 100.000).
  2. Promo Global: Diskon Rp 10.000 untuk **Seluruh Toko** (`minPurchase` = 0).
* **Pembelian:**
  * Pelanggan membeli **1 Sepatu Formal Hitam** dan **1 Sepatu Casual Putih** (harga normal Rp 80.000).
* **Hasil Perhitungan:**
  * **Sepatu Formal Hitam:** Terpotong Rp 25.000 (Prioritas tingkat Varian aktif, Promo Global diabaikan). Harga bersih = Rp 75.000.
  * **Sepatu Casual Putih:** Terpotong Rp 10.000 (Tidak ada promo produk/varian, Promo Global diterapkan). Harga bersih = Rp 70.000.
  * **Total Akhir:** Rp 75.000 + Rp 70.000 = **Rp 145.000** (Toko aman dari kerugian dobel diskon pada sepatu formal).

### Kasus B: Promo Bersyarat POS
* **Promo Aktif:**
  * Promo Bersyarat: Potongan Rp 2.000 jika belanja minimal Rp 20.000.
* **Pembelian:**
  * Pelanggan membeli **2 Sepatu Formal** seharga @Rp 10.000.
* **Hasil Perhitungan:**
  * Subtotal belanja = Rp 20.000 (Memenuhi syarat minimal belanja Rp 20.000).
  * Potongan Flat = Rp 2.000 (Muncul di rincian ringkasan bawah sebagai **Promo Bersyarat**).
  * **Total Pembayaran Akhir:** **Rp 18.000**.
