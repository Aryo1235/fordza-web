# Panduan Sistem POS (Kasir) - Fordza-Web

## 📋 Overview

Sistem POS (Point of Sale) Fordza-Web adalah aplikasi kasir untuk transaksi penjualan offline di toko.

**URL:** `http://localhost:3000/pos`

---

## 🔐 Login Kasir

### **1. Akses Halaman Login**

Buka: `http://localhost:3000/login`

### **2. Masukkan Credentials**

Gunakan username & password kasir yang sudah dibuat admin.

**Contoh:**
- Username: `kasir1`
- Password: `password123`

### **3. Klik "Login"**

Setelah berhasil, kamu akan diarahkan ke halaman POS.

---

## 🕐 Manajemen Shift

### **Buka Shift**

**WAJIB** buka shift sebelum bisa transaksi.

#### **Cara Buka Shift:**

1. Setelah login, akan muncul **Shift Blocker Modal**
2. Isi **Modal Awal** (starting cash di laci kasir)
   - Contoh: Rp 500.000
3. Klik **"Buka Shift"**

**Proses:**
- System create shift record
- Status: OPEN
- Kasir bisa mulai transaksi

**Catatan:**
- 1 kasir hanya bisa punya 1 shift OPEN
- Harus tutup shift sebelum buka shift baru

---

### **Tutup Shift**

Tutup shift di akhir hari atau akhir shift kerja.

#### **Cara Tutup Shift:**

1. Klik **"Tutup Shift"** di sidebar
2. Akan muncul **Close Shift Modal**
3. Review:
   - **Modal Awal** - Starting cash
   - **Total Penjualan** - Revenue dari transaksi
   - **Expected Ending Cash** - Modal awal + penjualan
4. Hitung uang di laci kasir
5. Isi **Actual Ending Cash** (uang fisik di laci)
6. Isi **Notes** (optional)
7. Klik **"Tutup Shift"**

**Hasil:**
- System calculate selisih (actual - expected)
- Jika selisih > 0: Lebih (surplus)
- Jika selisih < 0: Kurang (deficit)
- Jika selisih = 0: Pas (balance)

**Contoh:**
```
Modal Awal: Rp 500.000
Total Penjualan: Rp 5.000.000
Expected Ending: Rp 5.500.000
Actual Ending: Rp 5.450.000
Selisih: -Rp 50.000 (kurang)
```

---

## 🛒 Transaksi Penjualan

### **Step 1: Pilih Produk**

#### **Cara 1: Search**
1. Ketik nama/kode produk di search box
2. Produk akan muncul di list
3. Klik produk

#### **Cara 2: Browse**
1. Scroll list produk
2. Klik produk yang ingin dijual

---

### **Step 2: Pilih Varian & Ukuran**

Setelah klik produk, akan muncul **Product Detail Modal**.

#### **Jika Produk Punya Varian:**

1. **Pilih Warna/Varian**
   - Klik salah satu varian (contoh: Black, Brown)
   - Harga akan update sesuai varian

2. **Pilih Ukuran (SKU)**
   - Klik salah satu ukuran (contoh: 40, 41, 42)
   - Stok akan ditampilkan
   - Jika stok = 0, ukuran disabled

3. **Lihat Harga Final**
   - Harga sudah termasuk promo (jika ada)
   - Jika ada harga coret, akan ditampilkan
   - Badge diskon akan muncul

#### **Jika Produk Tanpa Varian:**

Langsung pilih qty, tidak perlu pilih varian/ukuran.

---

### **Step 3: Input Quantity**

1. Isi **Qty** (default: 1)
2. Cek stok tersedia
3. Qty tidak boleh > stok

---

### **Step 4: Tambah ke Keranjang**

Klik **"Tambah ke Keranjang"**

**Proses:**
- Item masuk ke cart drawer
- Modal tertutup
- Bisa lanjut pilih produk lain

---

### **Step 5: Review Keranjang**

Klik **icon cart** di kanan atas untuk buka **Cart Drawer**.

**Informasi di Cart:**
- List items:
  - Nama produk
  - Varian & ukuran
  - Harga satuan
  - Qty
  - Subtotal
- **Total Harga**
- **Total Diskon**
- **Grand Total**

**Actions:**
- **Edit Qty:** Klik +/- untuk ubah qty
- **Hapus Item:** Klik icon trash
- **Clear Cart:** Klik "Clear All"

---

### **Step 6: Checkout**

#### **1. Klik "Checkout"**

Akan muncul **Checkout Section** di cart drawer.

#### **2. Isi Data Customer (Optional)**

| Field | Required | Description |
|-------|----------|-------------|
| Nama Customer | ❌ | Nama pembeli |
| No. Telepon | ❌ | Nomor telepon |

**Catatan:**
- Optional tapi recommended untuk CRM
- Bisa kosongkan jika customer tidak mau kasih data

#### **3. Isi Uang Diterima**

| Field | Required | Description |
|-------|----------|-------------|
| Uang Diterima | ✅ | Jumlah uang yang diterima dari customer |

**Contoh:**
```
Grand Total: Rp 680.000
Uang Diterima: Rp 700.000
Kembalian: Rp 20.000 (auto-calculate)
```

**Validasi:**
- Uang diterima harus ≥ grand total
- Jika kurang, akan muncul error

#### **4. Isi Notes (Optional)**

Catatan tambahan untuk transaksi.

#### **5. Klik "Proses Pembayaran"**

**Proses:**
1. Validate data
2. Create transaction record
3. Create transaction items (snapshot harga & promo)
4. Decrement stock (SKU level)
5. Create stock logs
6. Update SkuSalesSummary (OLAP)
7. Generate invoice number
8. Show invoice modal

---

### **Step 7: Cetak Invoice**

Setelah checkout berhasil, akan muncul **Invoice Modal**.

**Informasi Invoice:**
- **Header:**
  - Logo toko
  - Nama toko
  - Alamat
  - No. telepon
  
- **Invoice Info:**
  - Invoice number
  - Tanggal & waktu
  - Kasir
  
- **Customer Info:**
  - Nama customer (jika ada)
  - No. telepon (jika ada)
  
- **Items:**
  - Nama produk
  - Varian & ukuran
  - Qty
  - Harga satuan
  - Diskon
  - Subtotal
  
- **Payment:**
  - Subtotal
  - Total diskon
  - **Grand Total**
  - Uang diterima
  - Kembalian

**Actions:**
- **Print:** Klik "Print" untuk cetak ke thermal printer
- **Close:** Klik "Close" untuk tutup modal

**Catatan:**
- Invoice otomatis format untuk thermal printer (58mm atau 80mm)
- Bisa cetak ulang dari menu "Cetak Ulang"

---

## 🔍 Quick Stock Check

Fitur untuk cek stok produk tanpa harus tambah ke cart.

### **Cara Menggunakan:**

1. Klik **"Quick Stock Check"** di sidebar
2. Search produk
3. Pilih produk
4. Lihat stok semua varian & ukuran

**Use Case:**
- Customer tanya stok
- Cek ketersediaan sebelum transaksi

---

## 📜 Riwayat Transaksi

### **List Transaksi**

**Menu:** Sidebar → Riwayat

**Fitur:**
- List transaksi shift aktif
- Filter by:
  - Status (PAID/VOID)
  - Tanggal
  - Invoice number
- Search invoice

**Kolom Tabel:**
| Column | Description |
|--------|-------------|
| Invoice No | Nomor invoice |
| Tanggal | Waktu transaksi |
| Total | Grand total |
| Status | PAID/VOID |
| Actions | View, Void |

---

### **Detail Transaksi**

**Menu:** Riwayat → [Pilih Transaksi]

**Informasi:**
- Invoice number
- Tanggal & waktu
- Kasir
- Customer info
- Items
- Payment details
- Status

**Actions:**
- **Cetak Ulang:** Print invoice lagi
- **Void:** Batalkan transaksi (butuh admin PIN)

---

## ❌ Void Transaksi

Void = batalkan transaksi yang sudah dibayar.

### **Kapan Perlu Void?**

- Salah input produk
- Salah input qty
- Salah input harga
- Customer return barang
- Kesalahan lainnya

### **Cara Void:**

1. Buka **Riwayat Transaksi**
2. Pilih transaksi yang mau di-void
3. Klik **"Void Transaction"**
4. Akan muncul **Void Dialog**
5. Isi **Admin PIN** (untuk authorization)
6. Isi **Alasan Void** (cancel reason)
7. Klik **"Void Transaction"**

**Proses:**
1. Verify admin PIN
2. Update transaction status = VOID
3. Restore stock (increment SKU)
4. Create stock logs (type: VOID)
5. Update SkuSalesSummary (decrement)

**Catatan:**
- Butuh admin PIN untuk security
- Stok otomatis dikembalikan
- Transaksi tetap tercatat (untuk audit)
- Tidak bisa void transaksi yang sudah di-void

---

## 🖨️ Cetak Ulang Invoice

Jika customer minta invoice lagi atau invoice hilang.

### **Cara Cetak Ulang:**

#### **Cara 1: Dari Riwayat**

1. Buka **Riwayat Transaksi**
2. Pilih transaksi
3. Klik **"Print"**

#### **Cara 2: Dari Menu Cetak Ulang**

1. Klik **"Cetak Ulang"** di sidebar
2. Isi **Invoice Number**
3. Klik **"Cari"**
4. Jika ditemukan, invoice akan muncul
5. Klik **"Print"**

**Catatan:**
- Bisa cetak ulang berkali-kali
- Invoice sama persis dengan yang asli
- Tidak ada biaya tambahan

---

## 💡 Tips & Best Practices

### **Sebelum Mulai Shift**

1. **Cek Koneksi Internet**
   - Pastikan internet stabil
   - Sistem butuh koneksi untuk sync data

2. **Cek Printer**
   - Pastikan thermal printer ready
   - Cek kertas cukup

3. **Hitung Modal Awal**
   - Hitung uang di laci kasir
   - Input dengan benar saat buka shift

### **Saat Transaksi**

1. **Konfirmasi dengan Customer**
   - Konfirmasi produk, warna, ukuran
   - Konfirmasi harga sebelum checkout

2. **Cek Stok**
   - Gunakan Quick Stock Check jika ragu
   - Jangan jual produk yang stoknya 0

3. **Input Data Customer**
   - Minta nama & no. telepon untuk CRM
   - Bisa untuk follow-up promo

4. **Hitung Uang dengan Teliti**
   - Hitung uang diterima dengan benar
   - Cek kembalian sebelum kasih ke customer

5. **Cetak Invoice**
   - Selalu cetak invoice untuk customer
   - Simpan copy untuk arsip (optional)

### **Akhir Shift**

1. **Hitung Uang di Laci**
   - Hitung dengan teliti
   - Pisahkan uang modal awal

2. **Cek Selisih**
   - Jika ada selisih, cek transaksi
   - Report ke admin jika selisih besar

3. **Tutup Shift**
   - Jangan lupa tutup shift
   - Isi notes jika ada kejadian penting

### **Keamanan**

1. **Jangan Share Password**
   - Password kasir pribadi
   - Jangan kasih ke orang lain

2. **Logout Setelah Selesai**
   - Logout setelah shift selesai
   - Jangan tinggalkan komputer dalam keadaan login

3. **Jaga Admin PIN**
   - Admin PIN untuk void transaction
   - Hanya admin yang tahu

---

## 🚨 Troubleshooting

### **Tidak Bisa Buka Shift**

**Penyebab:**
- Sudah ada shift OPEN

**Solusi:**
- Tutup shift yang lama dulu
- Atau hubungi admin untuk close shift

---

### **Produk Tidak Muncul di Search**

**Penyebab:**
- Produk inactive
- Produk tidak punya varian aktif
- Produk stok 0

**Solusi:**
- Hubungi admin untuk cek produk
- Admin bisa aktifkan produk atau restock

---

### **Tidak Bisa Tambah ke Cart**

**Penyebab:**
- Stok tidak cukup
- Qty > stok tersedia

**Solusi:**
- Kurangi qty
- Atau pilih ukuran lain yang ada stok

---

### **Checkout Gagal**

**Penyebab:**
- Uang diterima < grand total
- Koneksi internet terputus
- Error server

**Solusi:**
1. Cek uang diterima
2. Cek koneksi internet
3. Coba lagi
4. Jika masih gagal, hubungi admin

---

### **Printer Tidak Mau Print**

**Penyebab:**
- Printer offline
- Kertas habis
- Driver printer belum install

**Solusi:**
1. Cek printer power on
2. Cek kertas
3. Cek koneksi USB/Bluetooth
4. Restart printer
5. Hubungi IT support jika masih bermasalah

---

### **Void Transaction Gagal**

**Penyebab:**
- Admin PIN salah
- Transaksi sudah di-void
- Koneksi internet terputus

**Solusi:**
1. Cek admin PIN dengan admin
2. Cek status transaksi
3. Cek koneksi internet
4. Coba lagi

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Focus search box |
| `Ctrl + K` | Open cart drawer |
| `Ctrl + Enter` | Checkout (jika cart drawer open) |
| `Esc` | Close modal/drawer |

---

## 📚 Related Documentation

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Panduan admin dashboard
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API documentation
- **[FEATURES.md](./FEATURES.md)** - Feature overview

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
