# Studi Kasus: SOP Alur Kerja Kasir & Integrasi Laporan Omzet
**Dokumen Pendukung Argumen untuk Sidang Skripsi / Dosen Penguji**

Dokumen ini disusun untuk mempertahankan desain Arsitektur *Cashier Shift* (Sistem Laci Kasir) Fordza Web POS di hadapan penguji jika dosen mempertanyakan:
1. *Mengapa Modal Awal tidak mempengaruhi jumlah total Omzet Toko?*
2. *Bagaimana jika ada pergantian shift dan Bos/Manajer tidak ada di toko?*

Berikut adalah skenario jawaban telak (*Real Case Scenario*) yang mengadopsi standar Ritel Modern seperti Indomaret / Starbucks.

---

## 🏛️ KASUS DEBAT 1: "Apakah Modal Awal Mengacaukan Laporan Penjualan (Omzet)?"

**Pertanyaan Dosen Penguji:** 
*"Kalau di sistem kamu Kasir memasukkan 'Modal Awal Laci' sebesar Rp 500.000, lalu hasil penjualannya Rp 2.000.000, apakah total pendapatan di laporan manajer akan kacau menjadi terhitung Rp 2.500.000?"*

**Bantahan & Solusi Arsitektur Sistem:**
*Tidak, Bapak/Ibu Dosen. Logika Akuntansi di sistem Fordza Web secara tegas membelah 2 aliran uang ke dalam mesin database yang berbeda:*

1. **Aliran Omzet Murni (Laporan Manajer):**
   Pada layer Repository API kami (`TransactionRepository.getReportStats`), sistem menarik grafik laporan omzet murni dari transaksi sepatu yang statusnya valid/dibayar (`priceAtSale` × `quantity`). Modal Rp 500.000 yang diketik Kasir disimpan terpisah di tabel `CashierShift` dan **tidak memiliki Foreign Key maupun rumus kalkulasi yang bersinggungan** dengan grafik menu Laporan Omzet. Sehingga, Laporan Omzet akan tampil jujur 100% senilai **Rp 2.000.000**.

2. **Aliran Audit Fisik (Laporan Laci / Cash Float):**
   Satu-satunya tempat di mana Modal Rp 500.000 ini diikutkan dalam hitungan adalah pada Menu **Audit Laporan Laci Kasir**. Menu ini dibangun khusus untuk Manajer sebagai "Alat Uji Kejujuran Karyawan". 
   Sistem di menu ini merumuskan: `[Modal Rp 500.000] + [Penjualan Rp 2.000.000] = Expected Fisik Rp 2.500.000`. Jika saat toko tutup Kasir menyetorkan uang kurang dari 2.5 Juta, sistem akan menerbitkan peringatan/label merah `MINUS`.

---

## 🏛️ KASUS DEBAT 2: "SOP Overan Laci / Shift Pagi ke Shift Sore tanpa Kehadiran Bos"

**Pertanyaan Dosen Penguji:**
*"Bagaimana kasusnya di dunia nyata jika Shift Pagi selesai jam 14.00, lalu Shift Sore mulai jam 14.00? Apakah Bos/Manajer harus capek-capek datang setiap jam 14.00 untuk mengambil uang setoran Shift Pagi dan mengisi manual Modal Awal untuk Kasir Shift Sore?"*

**Bantahan & Solusi Sistem Operasional (Mengadopsi SOP Indomaret/Retail Skala Besar):**
*Tidak perlu, Bapak/Ibu. Aplikasi Fordza Web dirancang agar Toko bisa berjalan otomatis layaknya ritel swalayan modern tanpa intervensi fisik Manajer setiap saat, menggunakan pendekatan "Drop-Safe Brankas". Berikut adalah alur berjalannya:*

### Skenario Operasional (Shift Handover)
1. **Modal Fisik Adalah "Uang Menginap" (Permanen)**
   Toko Fordza *secara fisik* selalu menyediakan pecahan receh (Misal: Rp 500.000) yang memang dijadikan modal pelumas. Uang ini tidak pernah ditarik oleh Bos, melainkan terus hidup/menginap di dalam laci mesin kasir dari hari ke hari.

2. **Pukul 14.00 (Titik Penutupan Shift Pagi)**
   Kasir A akan pulang. Sesuai sistem *Hard-Blocker* di Fordza Web, Kasir A dipaksa menekan **Tutup Shift**. Ia menghitung total uang yang ada di mejanya (Modal 500rb + Jualan Pagi 2Juta). Ketemu total **Rp 2.500.000**. Ia submit angkanya ke dalam sistem yang mengakibatkan *Logout Otomatis*.

3. **Operasional Tanpa Bos (Drop Safe)**
   Karena Bos tidak di tempat, SOP secara fisik mewajibkan Kasir A memasukkan/mengamankan uang laba/omzetnya (sebanyak Rp 2.000.000) ke dalam "Brankas Drop-Safe" (brankas yang hanya ada lubang untuk memasukkan uang, tidak bisa memegang kunci untuk membuka). 
   Di atas meja, Kasir A **kembali menyisakan persis Rp 500.000 pecahan** sebagai pelumas untuk kawan Shiftnya.
   
4. **Pukul 14.05 (Pembukaan Ulang Shift Sore)**
   Kasir B datang ke mesin komputer. Ia me-*login* ke Fordza Web. Blocker sistem kita kembali bangun menagih *"Berapa lembar kertas yang Anda bawa di laci meja Anda saat ini?"*.
   Kasir B menghitung uang sisa peninggalan Kasir A. *Pas 500 Ribu.* Ia ketik angka tersebut untuk mulai bekerja. 

### Kesimpulan Argumen
Dosen penguji dapat melihat bahwa **Manajer tidak perlu stand-by di toko.** Bos hanya perlu datang di Malam Hari atau Seminggu Sekali untuk membuka brankas, dan mencocokannya dengan barisan baris per-baris *Log Shift* di Layar "Laporan Laci" Aplikasi, di mana aktivitas Kasir A dan Kasir B tercatat secara independen dan akurat. Arsitektur logika "Modal Blocker" mampu mencegah kecurangan *overan* laci tanpa merusak data fundamental omzet.
