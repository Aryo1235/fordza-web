# SOP Operasional: Void, Retur, dan Refund
Dokumen ini menjelaskan Standar Operasional Prosedur (SOP) toko Fordza dalam menangani pembatalan transaksi (Void), penukaran barang (Return), dan pengembalian dana (Refund). Dokumen ini dirancang sebagai panduan operasional kasir/admin sekaligus panduan argumen akademis saat sidang skripsi.

---

## 1. Perbedaan Konseptual (Void vs. Retur vs. Refund)

Pada sistem Fordza, **Return (Tukar Barang)** dan **Refund (Kembali Uang)** diselesaikan menggunakan fitur **VOID dengan Otoritas Admin** untuk menjamin akurasi laporan keuangan dan stok tanpa merusak data keuangan kasir harian.

| Kategori | VOID (Pembatalan Instan) | RETURN (Tukar Sepatu) | REFUND (Pengembalian Dana) |
|---|---|---|---|
| **Penyebab** | Kesalahan input kasir (salah ketik barang/metode bayar) di shift yang sama. | Pelanggan menukar ukuran (*size*) atau warna sepatu yang dibeli kemarin. | Pelanggan mengembalikan sepatu yang dibeli kemarin dan meminta uang kembali. |
| **Waktu SOP** | Harus di hari yang sama, **sebelum shift kasir ditutup**. | Dibatasi oleh aturan toko, umumnya **1x24 jam** s.d **3x24 jam**. | Mengikuti kebijakan retur toko setelah transaksi selesai dibawa pulang. |
| **Sumber Dana** | **Laci Kasir Aktif** (uang kasir langsung diserahkan kembali). | Tidak ada uang keluar (hanya penukaran fisik barang). | **Brankas Utama (Back-Office)**, demi menjaga keseimbangan laci kasir harian. |
| **Penyelesaian Sistem** | Tombol **VOID** (Kasir / Admin). | **VOID Admin** + **Transaksi Baru** di POS. | **VOID Admin** (Pembatalan total invoice lama). |

---

## 2. Standar Operasional Prosedur (SOP) Sistem

### SOP 1: Pembatalan Transaksi Instan (VOID - Salah Input Kasir)
*Digunakan jika kasir salah menginput barang/metode pembayaran dan shift kasir hari itu masih aktif (belum ditutup).*

1. Kasir membuka menu **Riwayat Transaksi** aktif.
2. Kasir mengklik tombol silang (`X`) merah atau masuk detail dan mengklik **Batalkan Transaksi (VOID)** pada invoice terkait.
3. Kasir memasukkan **Alasan Pembatalan** dan **PIN Admin** untuk otorisasi keamanan.
4. **Hasil Akhir**:
   - Status invoice berubah menjadi `VOID` di database.
   - Stok barang otomatis bertambah kembali ke sistem database (*auto-restore*).
   - Laporan keuangan harian otomatis dikurangi (karena transaksi VOID tidak dihitung sebagai omzet).
   - Nilai expected cash di laci kasir otomatis dikurangi.

---

### SOP 2: Pengembalian Uang (REFUND)
*Digunakan jika pelanggan mengembalikan sepatu yang dibeli kemarin (shift sudah ditutup) dan meminta uangnya kembali.*

1. Kasir menerima kembali sepatu yang dikembalikan oleh pelanggan.
2. Kasir meminta **Admin/Owner** mengambil uang pengembalian (refund) dari **Brankas Utama Toko** (bukan laci kasir aktif hari ini).
3. **Admin** masuk ke Dashboard Admin menggunakan akun Admin miliknya.
4. Admin mencari invoice transaksi kemarin di menu **Riwayat Transaksi**.
5. Admin mengklik tombol **Batalkan (VOID)** pada invoice tersebut.
6. Sistem memverifikasi bahwa pengakses adalah Admin dan menyetujui VOID pada shift tertutup.
7. **Hasil Akhir**:
   - Status invoice lama berubah menjadi `VOID` ➔ **Laporan Penjualan (Omzet) otomatis dikoreksi (berkurang)**.
   - Stok sepatu yang dikembalikan otomatis bertambah kembali ke database secara akurat.
   - expected cash laci kasir hari ini tidak terganggu (tidak selisih minus) karena uang dikembalikan dari brankas manual.

---

### SOP 3: Penukaran Ukuran/Warna Sepatu (RETURN)
*Digunakan jika pelanggan menukar sepatu yang dibeli kemarin (shift sudah ditutup) dengan ukuran/warna lain.*

1. Kasir menerima kembali sepatu lama pelanggan, dan mengambilkan sepatu ukuran baru dari rak.
2. **Admin** masuk ke Dashboard Admin menggunakan akun Admin miliknya.
3. Admin mencari invoice transaksi kemarin, lalu mengklik tombol **Batalkan (VOID)** (ini otomatis memulihkan stok sepatu lama yang dikembalikan).
4. Kasir kemudian membuat **Transaksi Penjualan Baru** di mesin kasir POS untuk sepatu ukuran baru yang dibawa pulang pelanggan (ini otomatis memotong stok sepatu baru).
5. **Hasil Akhir**:
   - Transaksi lama dinonaktifkan (`VOID`), transaksi baru dicatat (`PAID`).
   - **Laporan Penjualan (Omzet) tetap akurat 100%** hingga tingkat detail ukuran sepatu yang dibawa pulang.
   - Stok sepatu di database dan di rak fisik toko ter-update dengan sempurna.

---

## 3. Simulasi Q&A Sidang Skripsi (Pertanyaan Dosen Penguji)

Berikut adalah contoh skenario pertanyaan dosen penguji mengenai SOP ini beserta jawaban yang tepat:

### ❓ Pertanyaan 1: "Bagaimana SOP Return dan Refund berjalan pada sistem POS Anda?"
> **Jawaban Akademis:**
> *"SOP Return dan Refund pada sistem Fordza diselesaikan menggunakan fitur **VOID dengan Otoritas Admin**.*
> 
> *Untuk **Refund**, Admin akan memberikan uang dari brankas secara manual, lalu mem-VOID transaksi kemarin agar laporan omzet otomatis berkurang dan stok kembali.*
> 
> *Untuk **Return (Tukar Size)**, Admin mem-VOID transaksi lama untuk mengembalikan stok sepatu lama, lalu Kasir membuat transaksi penjualan baru di mesin kasir POS untuk sepatu ukuran baru. Alur ini menjamin pembukuan laci kasir harian tidak selisih dan data stok di database tetap akurat."*

### ❓ Pertanyaan 2: "Mengapa Anda memilih alur VOID Admin + Transaksi Baru untuk Retur, daripada membuat modul retur khusus?"
> **Jawaban Akademis:**
> *"Ada dua pertimbangan utama, yaitu **Keamanan (Audit Control)** dan **Akurasi Laporan**:*
> 1. ***Keamanan**: Membatasi kasir biasa mem-void transaksi dari shift tertutup mencegah kecurangan kasir memanipulasi uang laci.*
> 2. ***Akurasi Laporan**: Dengan melakukan VOID pada transaksi lama dan membuat transaksi baru untuk ukuran sepatu yang baru, Laporan Penjualan di database akan mencatat dengan tepat produk dan ukuran sepatu apa yang benar-benar dibawa pulang oleh pelanggan, bukan ukuran lama yang salah input."*

### ❓ Pertanyaan 3: "Bagaimana jika produk dalam transaksi tersebut sudah dihapus dari sistem oleh admin, lalu transaksinya di-void? Apakah sistem akan error?"
> **Jawaban Akademis:**
> *"Tidak akan error. Sistem kami sudah menerapkan penanganan error defensif di repositori backend. Jika `productId` terdeteksi bernilai `null` (karena produk telah dihapus), database akan **melewati (*skip*)** proses pemulihan stok untuk produk tersebut, namun tetap melanjutkan pembaruan status transaksi menjadi `VOID` agar laporan keuangan omzet tetap terkoreksi dengan sukses."*

### ❓ Pertanyaan 4: "Bagaimana sistem Anda menjamin stok di database tidak menjadi negatif jika dua kasir menekan tombol bayar bersamaan pada sisa stok terakhir?"
> **Jawaban Akademis:**
> *"Sistem kami menggunakan fitur `prisma.$transaction` untuk menjamin ACID di database. Setelah perintah pemotongan stok dijalankan, sistem melakukan pemeriksaan seketika. Jika stok hasil update bernilai kurang dari 0 (`stock < 0`), sistem akan melempar `Error` yang memaksa database PostgreSQL melakukan **Rollback** (pembatalan seluruh operasi transaksi) secara instan. Ini mencegah kebocoran stok negatif akibat masalah *race condition*."*

---

## 5. Draf Laporan Skripsi Bab 5 (Kesimpulan & Saran)

Berikut adalah draf tulisan akademis yang dapat Anda adaptasi langsung ke dalam **Bab 5 Skripsi (Kesimpulan dan Saran)** Anda:

### 5.1. Kesimpulan (Terkait Batasan Retur & Void)
Berdasarkan hasil analisis, perancangan, dan implementasi sistem yang telah dilakukan, dapat ditarik beberapa kesimpulan penting sebagai berikut:
1. Sistem telah berhasil mengimplementasikan metode **Otoritas Pembatalan (VOID) Khusus Admin** untuk memproses retur barang (tukar ukuran) dan refund (pengembalian dana) setelah shift kasir ditutup. Pendekatan ini terbukti efektif dalam menjaga integritas data laporan keuangan (omzet) dan stok inventaris di database secara otomatis pasca-void tanpa merusak pembukuan laci kasir harian (*shift*).
2. Sistem berhasil mengunci hak akses kasir biasa untuk melakukan pembatalan (*void*) pada shift laci kasir yang telah ditutup (*CLOSED*), yang berfungsi sebagai kontrol internal (*Internal Control*) guna meminimalkan celah kecurangan (*fraud prevention*) manipulasi kasir harian di toko.

### 5.2. Saran Pengembangan (Terkait Return & Refund Otomatis)
Berdasarkan keterbatasan sistem yang ada saat ini, disarankan beberapa poin pengembangan untuk penelitian atau pembuatan sistem selanjutnya:
1. **Pengembangan Modul Kas Besar (Safe Cash Ledger)**: Disarankan untuk membangun modul pencatatan kas utama/brankas toko (*safe cash ledger*) yang terintegrasi secara sistematis dengan sistem kasir, sehingga jika terjadi refund dana lewat brankas manual, mutasi kas keluar brankas dapat dicatat secara otomatis di dalam satu sistem POS terpadu.
2. **Pengembangan Modul Pengembalian Mandiri (Dedicated Return & Refund Module)**: Penelitian selanjutnya dapat menambahkan modul khusus retur barang (*dedicated return wizard*) yang dapat memproses penukaran barang beda harga secara otomatis dan menghasilkan struk retur khusus tanpa harus melalui prosedur pembatalan (*void*) transaksi lama terlebih dahulu.

