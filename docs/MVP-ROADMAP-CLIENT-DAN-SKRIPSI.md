# MVP dan Roadmap Sistem Fordza (Client + Skripsi)

Tanggal: 2026-04-07  
Konteks: Sistem awal adalah katalog toko offline. Pengembangan difokuskan ke POS offline dengan role kasir terpisah.

## Tujuan Dokumen

Dokumen ini menjadi acuan bersama untuk:

1. Client: sistem terlihat profesional dan siap dipakai operasional.
2. Skripsi: scope tetap realistis dan bisa selesai tepat waktu.

## Keputusan Arsitektur Terbaru

1. Menambah 1 role baru: KASIR.
2. Tampilan kasir dipisah dari tampilan admin.
3. ADMIN adalah role tertinggi.
4. Fokus transaksi offline POS, bukan e-commerce online.

## Posisi Sistem Saat Ini

Yang sudah ada:

1. Katalog publik produk.
2. Detail produk dan rekomendasi KNN.
3. CMS admin untuk produk, kategori, banner, testimoni, template ukuran.
4. Login admin dan proteksi endpoint admin.

Yang ditambahkan pada fase ini:

1. Role KASIR.
2. Halaman POS khusus kasir.
3. Riwayat transaksi kasir.
4. Laporan harian sederhana.

## Pembagian Role dan Tampilan

### ADMIN (Role Tertinggi)

Hak akses:

1. Kelola katalog (produk, kategori, banner, testimoni, template ukuran).
2. Lihat laporan penjualan.
3. Kelola akun kasir (manajemen kasir).
4. Akses data transaksi penuh.

Menu utama admin:

1. Dashboard
2. Produk
3. Kategori
4. Banner
5. Testimoni
6. Template Ukuran
7. Laporan Penjualan
8. Manajemen Kasir

### KASIR

Hak akses:

1. Buat transaksi POS.
2. Lihat riwayat transaksi.
3. Cetak ulang struk.
4. Kasir tidak dapat menghapus data transaksi yang sudah berstatus PAID (hanya bisa melakukan VOID jika diizinkan, atau murni hanya hak Admin)."

Menu utama kasir:

1. POS
2. Riwayat Transaksi
3. Cetak Ulang Struk

## Scope MVP Skripsi (Dikunci agar Selesai)

Fitur wajib MVP:

1. POS transaksi (pilih produk, qty, kalkulasi total, pembayaran, simpan transaksi, dan otomatisasi pengurangan stok produk).
2. Riwayat transaksi (list, cari nomor struk, filter tanggal).
3. Laporan harian (omzet dan jumlah transaksi).
4. Pemisahan role ADMIN dan KASIR.

Status transaksi MVP:

1. PAID
2. VOID

Catatan:

1. Status dibuat minimal agar implementasi cepat selesai.
2. Fitur retur detail bisa masuk fase lanjutan.

## Opsi Pencetakan Invoice / Struk (UI Kasir)

Sistem akan menyediakan **dua tombol pilihan utama** di layar sesaat setelah transaksi dinyatakan selesai (PAID). Kasir dapat memilih mode cetak sesuai kebutuhan atau kondisi kelengkapan alat:

1. **Cetak Hardware (Thermal Printer)**
   - Sistem akan langsung memicu dialog *Print* Windows untuk mencetak ke printer thermal (58mm/80mm) kasir.
   - Berguna untuk memberikan bukti fisik struk secarik kertas secara instan ke tangan pelanggan di toko fisik.

2. **Cetak Digital (Unduh PDF)**
   - Sistem akan mem- *build* dan men-generate invoice ke dalam bentuk file berektensi `.pdf`.
   - Sangat berguna sebagai opsi *Paperless* (tanpa kertas) jika pelanggan meminta untuk dikirim via WhatsApp/Email, atau jika kebetulan alat printer thermal sedang rusak/kertas habis.

**Prinsip implementasi pencetakan:**
1. Transaksi wajib tersimpan dan merubah status menjadi **PAID** di database *sebelum* kedua opsi tombol cetak ini muncul.
2. Jika proses cetak hardware *error/gagal*, itu sama sekali tidak mempengaruhi / membatalkan status transaksi di dalam laporan.
3. Kasir diberikan keleluasaan penuh untuk mencetak ulang (*Reprint* atau *Re-download PDF*) secara bebas kapanpun melalui menu "Riwayat Transaksi".

## Batasan Masalah Skripsi

1. Fokus transaksi offline POS.
2. Tidak membahas payment gateway online.
3. Tidak membahas pengiriman dan marketplace.
4. Tidak memakai RabbitMQ pada fase MVP.
5. Integrasi printer hardware dibuat opsional (siap, tapi tidak wajib aktif).

## KPI Keberhasilan

KPI operasional:

1. Waktu proses 1 transaksi kasir <= 60 detik.
2. Akurasi total harian = 100% terhadap data transaksi.
3. Pencarian transaksi berdasarkan nomor struk <= 3 detik.

KPI akademik:

1. Skenario login role ADMIN dan KASIR berjalan.
2. Skenario transaksi PAID dan VOID bisa diuji end-to-end.
3. Laporan harian sesuai data transaksi aktual.

## Rencana Implementasi 3 Minggu (Realistis)

Minggu 1:

1. Tambah field role user (ADMIN, KASIR).
2. Atur redirect dan proteksi halaman berdasarkan role.
3. Siapkan schema transaksi minimal.

Minggu 2:

1. Bangun halaman POS khusus kasir.
2. Bangun riwayat transaksi dan detail struk.
3. Implement status PAID dan VOID.

Minggu 3:

1. Bangun laporan harian sederhana.
2. Implement struk digital atau PDF.
3. Uji end-to-end dan finalisasi dokumen skripsi.

## Narasi Singkat untuk Presentasi Client

"Fordza dikembangkan dari katalog offline menjadi POS offline dengan role kasir terpisah dari admin. Fase pertama difokuskan pada transaksi cepat, riwayat, dan laporan harian agar langsung bisa dipakai toko. Integrasi alat struk disiapkan dua mode: tanpa alat dan dengan printer thermal."

## Narasi Singkat untuk Presentasi Dosen

"Penelitian ini mengembangkan sistem toko offline secara komprehensif, mulai dari optimalisasi front-office melalui katalog pintar dengan sistem rekomendasi K-Nearest Neighbor (KNN), hingga digitalisasi back-office melalui Point of Sales (POS) berbasis Role-Based Access Control (ADMIN & KASIR). Pendekatan MVP dipilih agar implementasi tuntas, terukur, dan dapat divalidasi langsung operasionalnya di toko."


## tech Stack untuk Print 
Struk & Invoice: react-to-print (Thermal) & jspdf (PDF)
