# Fitur-Fitur Sistem Fordza
## Katalog Digital & Point of Sale (POS) Terpadu

> Dokumen ini mendeskripsikan fitur fungsional sistem Fordza yang dikelompokkan per modul, disusun untuk keperluan penulisan laporan/skripsi/tugas akhir.

---

## 📋 Gambaran Umum Sistem

Sistem **Fordza** adalah aplikasi berbasis web yang mengintegrasikan tiga modul utama:

1. **Katalog Digital (Publik)** — Etalase virtual untuk pelanggan melihat dan mencari produk secara online.
2. **Point of Sale / POS (Kasir)** — Sistem transaksi tatap muka untuk staf toko.
3. **Dashboard Admin (CMS)** — Panel pengelolaan seluruh data dan operasional toko.

---

## 🌐 Modul 1: Katalog Digital (Halaman Publik)

Dapat diakses tanpa login oleh siapapun sebagai etalase digital toko.

### F1 — Beranda (Home)
Menampilkan banner promo carousel, section produk populer, bestseller, dan new arrivals sebagai halaman utama katalog.

### F2 — Katalog & Filter Produk
Menampilkan seluruh produk aktif dengan fitur pencarian, filter berdasarkan kategori/gender/tipe produk, dan pagination. Termasuk halaman **Kategori** yang menampilkan semua kategori produk beserta gambarnya.

### F3 — Detail Produk & Rekomendasi KNN
Menampilkan informasi lengkap produk (deskripsi, material, spesifikasi), galeri gambar per varian, pemilihan warna dan ukuran beserta stok, panduan ukuran, dan rating ulasan. Dilengkapi fitur **Rekomendasi Produk Serupa** menggunakan algoritma K-Nearest Neighbor (KNN) berbasis *Content-Based Filtering* dengan perhitungan jarak Euclidean.

### F4 — Testimoni & Tentang Kami (About)
Halaman yang menampilkan ulasan dan rating pelanggan dari berbagai produk, serta informasi profil dan kontak toko Fordza.

---

## 🏪 Modul 2: Point of Sale — POS (Sistem Kasir)

Hanya dapat diakses oleh pengguna dengan role **KASIR** atau **ADMIN** setelah login.

### F5 — Manajemen Shift
Kasir wajib **membuka shift** sebelum memulai transaksi dengan mengisi modal awal (uang di laci kasir). Di akhir shift, kasir **menutup shift** dengan mengisi jumlah uang aktual di laci; sistem otomatis menghitung **selisih surplus atau defisit** antara uang yang seharusnya ada dan uang aktual.

### F6 — Transaksi Penjualan
Mencakup seluruh alur transaksi: pencarian produk secara real-time, pemilihan varian warna dan ukuran beserta pengecekan stok, pengelolaan keranjang (tambah/edit/hapus item), input jumlah uang diterima dengan kalkulasi kembalian otomatis, serta penerapan promo diskon secara otomatis sesuai hierarki yang berlaku.

### F7 — Invoice & Cetak Struk
Sistem otomatis membuat **nomor invoice unik** setiap transaksi dan menampilkan detail lengkap transaksi. Invoice dapat dicetak ke **thermal printer 58mm/80mm** dan dapat **dicetak ulang** kapan saja dari riwayat transaksi.

### F8 — Riwayat & Pembatalan Transaksi (Void)
Kasir dapat melihat riwayat seluruh transaksi pada shift aktif dengan filter status dan pencarian nomor invoice. Transaksi yang sudah dibayar dapat **dibatalkan (void)** dengan verifikasi **PIN Admin** dan pengisian alasan; sistem otomatis memulihkan stok produk yang dibatalkan.

### F9 — Cek Stok Cepat
Kasir dapat mengecek stok produk per varian dan ukuran secara instan tanpa perlu membuat transaksi, berguna saat pelanggan menanyakan ketersediaan barang.

---

## ⚙️ Modul 3: Dashboard Admin (CMS)

Hanya dapat diakses oleh pengguna dengan role **ADMIN** setelah login.

### F10 — Dashboard & Statistik
Menampilkan metrik utama hari ini (total revenue, jumlah transaksi, stok menipis), grafik penjualan 7 hari terakhir, dan daftar transaksi terbaru sebagai pusat monitoring operasional toko.

### F11 — Manajemen Produk
CRUD produk lengkap mencakup informasi dasar, detail spesifikasi (rich text), upload gambar (multiple, drag & drop), pengelolaan varian warna beserta harga, dan pengelolaan SKU (ukuran + stok + harga override untuk bigsize). Termasuk fitur **bulk import via CSV** untuk menambah ratusan produk sekaligus dan **export ke Excel**. Produk yang dihapus menggunakan soft delete sehingga histori tetap tersimpan.

### F12 — Manajemen Konten (Kategori, Banner, Testimoni)
- **Kategori**: CRUD kategori produk beserta gambar, dengan drag & drop untuk mengatur urutan tampilan di katalog.
- **Banner**: CRUD banner homepage carousel dengan konfigurasi link URL dan toggle aktif/nonaktif.
- **Testimoni**: CRUD ulasan pelanggan; sistem otomatis menghitung ulang rating rata-rata produk setiap ada perubahan.

### F13 — Manajemen Promo
CRUD promo diskon dengan tipe **persentase (%)** atau **nominal (Rp)**. Promo dapat diarahkan ke target GLOBAL, KATEGORI, PRODUK, atau VARIAN tertentu dengan sistem **hierarki prioritas** (VARIANT > PRODUCT > CATEGORY > GLOBAL). Mendukung **promo kondisional** berdasarkan minimum pembelian dan konfigurasi periode aktif.

### F14 — Manajemen Stok
Mencakup dua sub-fitur yang terintegrasi:
- **Stok Opname**: Update stok banyak SKU sekaligus dalam satu halaman dengan highlight perubahan sebelum disimpan.
- **Histori Stok (Stock Logs)**: Catatan lengkap setiap perubahan stok di level produk maupun level SKU per ukuran, dengan filter berdasarkan tipe log (SALE / VOID / RESTOCK / ADJUSTMENT), tanggal, produk, dan operator, serta fitur export ke Excel untuk keperluan audit.

### F15 — Laporan Penjualan & Shift
- **Laporan Penjualan**: Ringkasan revenue, jumlah transaksi, grafik harian, dan laporan produk/ukuran terlaris, dengan filter rentang tanggal dan kasir, serta export multi-sheet ke Excel.
- **Laporan Shift (Laci Kasir)**: Riwayat seluruh shift semua kasir beserta detail modal awal, expected cash, actual cash, dan selisih surplus/defisit per shift.

### F16 — Manajemen Pengguna & Akses
CRUD akun pengguna dengan role ADMIN atau KASIR, konfigurasi PIN 4 digit untuk otorisasi void transaksi, password tersimpan dalam hash bcrypt. Termasuk pengelolaan **template ukuran** (EU, US, UK) yang dapat digunakan ulang untuk berbagai produk.

---

## 📊 Ringkasan Fitur

| Modul | Kode | Jumlah Fitur |
|-------|------|-------------|
| 🌐 Katalog Digital (Publik) | F1 – F4 | 4 fitur |
| 🏪 Point of Sale (Kasir) | F5 – F9 | 5 fitur |
| ⚙️ Dashboard Admin (CMS) | F10 – F16 | 7 fitur |
| **Total** | **F1 – F16** | **16 fitur** |

---

## 🤖 Algoritma Unggulan: KNN (bagian dari F3)

Rekomendasi produk menggunakan **K-Nearest Neighbor** berbasis *Content-Based Filtering*:

| Atribut | Encoding |
|---------|----------|
| Gender (Man/Woman/Unisex) | One-Hot Encoding |
| Tipe Produk (Shoes/Sandals/Boots) | One-Hot Encoding |
| Kategori (Formal/Casual/Sport/dll) | One-Hot Encoding |
| Material (Kulit/Suede/Canvas/dll) | One-Hot Encoding |
| Harga | Min-Max Normalization (0.0–1.0) |

**Formula jarak:** $d(p, q) = \sqrt{\sum_{i=1}^{n} (p_i - q_i)^2}$

Sistem menampilkan **K=4 produk terdekat** sebagai rekomendasi "Produk Serupa".

---

## 📚 Dokumen Terkait

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arsitektur sistem
- [DATABASE.md](./DATABASE.md) — Skema database
- [API_REFERENCE.md](./API_REFERENCE.md) — Referensi API
- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) — Panduan admin
- [KASIR_GUIDE.md](./KASIR_GUIDE.md) — Panduan kasir POS

---

*Fordza — Sistem Katalog Digital & Point of Sale Terpadu*
*Versi 1.0.0 | 2026*
