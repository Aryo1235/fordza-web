# Laporan Perbaikan Bug (Bug Fix Report) - Sistem Promo & Struk Fordza Web

Dokumen ini merangkum daftar bug kritis terkait mesin promo (promo engine), sinkronisasi frontend-backend, kalkulasi diskon struk belanja, dan UI/UX yang telah berhasil diperbaiki. Anda dapat memberikan dokumen ini kepada AI asisten Anda untuk menerapkan perbaikan yang sama di proyek kloningan.

---

## 1. Bug: Duplikasi Diskon Nominal Bersyarat (Multi-line Promo Leakage)

### File yang Terpengaruh:
* **Backend:** [backend/services/transaction.service.ts](file:///e:/fordza-web/backend/services/transaction.service.ts) (Step 3)
* **Frontend:** [app/(kasir)/pos/page.tsx](file:///e:/fordza-web/app/(kasir)/pos/page.tsx) (`processedCart`)

### Masalah (Penyebab):
Saat kasir memasukkan produk yang sama dengan ukuran atau varian yang berbeda (sehingga terbagi menjadi beberapa baris terpisah di keranjang belanja), sistem memproses kalkulasi diskon per baris secara mandiri.
Jika produk tersebut terikat ke promo nominal bersyarat (misal: *Promo Flat Rp 10.000 dengan minimal belanja Rp 100.000*), loop perulangan baris menyebabkan potongan flat tersebut diaplikasikan berulang kali di setiap baris (dikali jumlah baris varian), padahal seharusnya diskon tetap flat Rp 10.000 sekali saja untuk grup promo tersebut.

### Solusi Perbaikan:
* **Pengelompokan berdasarkan Promo ID/Name:** Ubah perhitungan agar mengelompokkan semua item di keranjang yang menggunakan Promo ID yang sama.
* **Prorasi Proporsional:** Cek minimal belanja berdasarkan gabungan subtotal kelompok tersebut. Jika lolos, berikan diskon flat sekali saja (misal Rp 10.000), lalu bagikan secara proporsional (prorata) ke masing-masing item di dalam kelompok.
* **Rumus Prorata:**
  $$\text{Porsi Diskon Item} = \frac{\text{Subtotal Item}}{\text{Total Subtotal Kelompok Promo}} \times \text{Nominal Diskon Flat}$$

---

## 2. Bug: Mismatch Penafsiran `discountAmount` di Struk (`InvoiceModal.tsx`)

### File yang Terpengaruh:
* **Frontend:** [features/kasir/components/InvoiceModal.tsx](file:///e:/fordza-web/features/kasir/components/InvoiceModal.tsx) (Bagian Cetak PDF & Render HTML)

### Masalah (Penyebab):
Di database, kolom `discountAmount` menyimpan **total diskon pada baris barang tersebut (Line Discount)**. Namun, file `InvoiceModal.tsx` mengasumsikan `discountAmount` sebagai **diskon per 1 unit barang (Unit Discount)**.
Akibatnya, harga bersih per unit dihitung salah: `netPrice = basePriceAtSale - discountAmount` (harga bersih satuan terpangkas terlalu drastis), lalu dikalikan lagi dengan kuantitas pada saat cetak subtotal baris. Hal ini membuat angka di struk dan file PDF menjadi berantakan/ngaco dan tidak sinkron dengan POS.

### Solusi Perbaikan:
Ubah pencarian `netPrice` di generator PDF dan render HTML struk agar membagi `discountAmount` dengan kuantitas terlebih dahulu untuk mendapatkan nilai diskon per unit:
```typescript
const unitDiscount = item.quantity > 0 ? (item.discountAmount / item.quantity) : 0;
const netPrice = item.basePriceAtSale - unitDiscount;
```

---

## 3. Bug: Kebocoran Perhitungan Promo Global Persentase (Global Percentage Mismatch)

### File yang Terpengaruh:
* **Backend:** [backend/services/transaction.service.ts](file:///e:/fordza-web/backend/services/transaction.service.ts) (Step 4)
* **Frontend:** [app/(kasir)/pos/page.tsx](file:///e:/fordza-web/app/(kasir)/pos/page.tsx) (`processedCart`)

### Masalah (Penyebab):
Jika ada Promo Global bertipe persentase (misal: *Diskon Toko 10%*), backend menghitung nilai diskonnya sebesar **10% dari total seluruh belanjaan kotor (sebelum diskon)** di transaksi.
Namun, karena aturan bisnis melarang dobel diskon (barang yang sudah punya promo spesifik dikeluarkan dari penerima promo global), nominal diskon global tersebut ditumpuk semuanya ke barang yang tersisa (misal Baju Koko). Hal ini membuat barang tersebut menerima potongan diskon tidak wajar (diskon Rp 102.262 untuk Baju Koko seharga Rp 110.000).

### Solusi Perbaikan:
Ubah formula perkalian persentase diskon global di frontend dan backend agar **hanya dikalikan dengan total subtotal barang yang berhak saja (Eligible Items Subtotal)**, bukan total kotor seluruh keranjang belanja:
```typescript
// Hitung total diskon global berdasarkan subtotal eligible
if (globalPromo.type === "PERCENTAGE") {
  totalGlobalDiscount = Math.round(totalEligibleSubtotal * Number(globalPromo.value) / 100);
}
```

---

## 4. UI/UX: Label "Aktif di Total" Membingungkan Kasir

### File yang Terpengaruh:
* **Frontend:** [app/(kasir)/pos/page.tsx](file:///e:/fordza-web/app/(kasir)/pos/page.tsx) (Pencetakan Badge Tag Promo)

### Masalah (Penyebab):
Ketika diskon flat bersyarat nominal (misal Rp 10.000) dibagi secara prorata ke 2 baris ukuran yang berbeda, sistem menampilkan tag **`Potongan Flat Rp 10.000 (Aktif di Total)`** di bawah setiap baris. Ini membingungkan kasir karena terlihat seakan-akan ada dua diskon Rp 10.000 yang aktif terpisah.

### Solusi Perbaikan:
Ubah label dinamis agar mencetak porsi diskon prorata riil yang diterima oleh baris tersebut:
```typescript
{item.isConditionalFixed
  ? item.lineDiscount > 0
    ? `(Aktif: -Rp ${item.lineDiscount.toLocaleString("id-ID")})`
    : `(Min. Rp ${item.minP.toLocaleString("id-ID")} - Belum Terpenuhi)`
  // ...
}
```
*Contoh output:* `Potongan Flat Rp 10.000 (Aktif: -Rp 5.000)`.

---

## 5. Bug: Tombol Reset Error Boundary Tidak Berefek Saat Server/Koneksi Mati

### File yang Terpengaruh:
* **Frontend:** [components/shared/ErrorBoundary.tsx](file:///e:/fordza-web/components/shared/ErrorBoundary.tsx)

### Masalah (Penyebab):
Tombol "Coba Lagi" bawaan React Error Boundary hanya mereset state internal React. Jika penyebab error adalah matinya dev server Next.js atau terputusnya koneksi WS (WebSocket), ketika React me-re-render komponen, ia langsung crash kembali secara instan. Bagi mata kasir, tombol seolah-olah macet/tidak merespon.

### Solusi Perbaikan:
Bungkus aksi reset dengan pemanggilan hard-reload halaman penuh untuk memaksa browser mengunduh ulang modul dari server:
```typescript
<Button 
  onClick={() => {
    resetErrorBoundary();
    window.location.reload();
  }} 
  variant="default"
>
  Coba Lagi
</Button>
```

---

## 6. Bug: Kebocoran Diskon Global Nominal Terkalikan Qty / Jenis Produk

### File yang Terpengaruh:
* **Frontend:** [app/(kasir)/pos/page.tsx](file:///e:/fordza-web/app/(kasir)/pos/page.tsx) (`processedCart`), [features/kasir/components/CartDrawer.tsx](file:///e:/fordza-web/features/kasir/components/CartDrawer.tsx)

### Masalah (Penyebab):
Di keranjang POS, diskon `GLOBAL NOMINAL` (misalnya: potongan langsung Rp 10.000 sekali belanja untuk satu transaksi) secara keliru terkalikan oleh kuantitas (`quantity`) barang atau terkalikan oleh jumlah baris produk unik yang dimasukkan ke keranjang belanja, sehingga total diskon membengkak secara tidak sah (kebocoran margin toko).

### Solusi Perbaikan:
* Di frontend, gunakan logika prorasi dinamis setelah loop barang selesai untuk mengunci total diskon global nominal tepat sebesar nilai promosinya (misal Rp 10.000), lalu distribusikan (bagi rata) ke item-item yang eligible (`isGlobalEligible`).
* Di `CartDrawer.tsx`, sederhanakan penjumlahan total diskon agar langsung merujuk ke nilai prorata `lineDiscount` per baris item, alih-alih menghitung ulang formulanya secara manual agar sinkron 100% dengan POS desktop & mobile.

---

## 7. Bug: Harga Coret Katalog Publik Tidak Memotong Harga Lead (Conditional Catalog Pricing)

### File yang Terpengaruh:
* **Backend:** [backend/repositories/products.repo.ts](file:///e:/fordza-web/backend/repositories/products.repo.ts) (`getAll`, `getById`, `calculatePromo`)
* **Frontend:** Halaman publik, landing page card, katalog `/products`, dan detail produk.

### Masalah (Penyebab):
Katalog publik (Landing Page & Detail Produk) tidak memotong harga awal/lead (tidak menampilkan harga coret terpotong) jika promo tersebut memiliki syarat minimal belanja (`minPurchase > 0`) atau merupakan nominal bersyarat, karena backend menandainya sebagai `isConditional = true`. Akibatnya pembeli di halaman depan melihat harga tetap utuh (misal Rp 110.000), padahal pemilik toko ingin harga coretnya langsung terlihat (menjadi Rp 100.000) untuk menarik minat pembeli.

### Solusi Perbaikan:
* Hapus filter/bendera `isConditional` dari fungsi `calculatePromo` di backend agar semua jenis diskon (termasuk yang memiliki minimal belanja) langsung memotong harga final di katalog publik.
* Di frontend, tambahkan lencana kuning nama promo bertuliskan syarat minimal belanja di samping harga produk (contoh: menampilkan badge nama promo disertai teks **`min. Rp 100.000`** atau **`tanpa min. belanja`** jika tidak ada syarat), agar transparan dan pembeli mengetahui syarat penggunaan promo tersebut sebelum membelinya.

