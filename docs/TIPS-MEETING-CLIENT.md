# Panduan Meeting dengan Client: Menjelaskan Fitur Tambahan (POS & Stok)

## 📌 Kesalahan Pola Pikir yang Harus Dihindari
**JANGAN MENGATAKAN INI:** *"Pak/Bu, berhubung saya butuh untuk syarat lulus skripsi, jadi saya tambahin fitur Kasir ya, walaupun bapak/ibu nggak minta."*
(Ini membuat client merasa aplikasi mereka dijadikan "kelinci percobaan" dan tidak fokus pada kebutuhan mereka).

**KATAKAN INI:** *"Pak/Bu, saya punya kabar gembira. Sistem katalognya sudah saya rancang dengan baik, dan saya memberikan *upgrade* gratis berupa sistem Kasir (POS) dan Manajemen Stok terpusat tanpa biaya tambahan."*
(Ini membuat client merasa diuntungkan, dihargai, dan mendapat nilai lebih).

---

## 💡 Strategi Komunikasi (Sudut Pandang Keuntungan Pelanggan)

Saat menjelaskan fitur tambahan yang Anda buat untuk Skripsi, **selalu kaitkan dengan apa untungnya bagi bisnis client**.

1. **Jelaskan Hubungan Katalog dan Stok (Sinkronisasi):** 
   "Katalog online akan jauh lebih efektif kalau stoknya terhubung. Kalau ada pelanggan lihat sepatu di web, tapi pas datang ke toko atau chat WhatsApp ternyata sepatunya habis, pelanggan pasti kecewa. Dengan fitur manajemen stok ini, katalog web akan selalu otomatis *sync* (sinkron) dengan barang asli di gudang."
2. **Jelaskan Manfaat POS (Kasir) sebagai Bonus:**
   "Karena stoknya sudah terdata rapi, sayang sekali kalau penjualan pembeli yang datang langsung ke toko (offline) masih dicatat manual pakai buku. Jadi, saya sekalian buatkan sistem Kasir (POS). Kalau ada yang beli langsung, tinggal diklik di sistem Kasir, otomatis laporan penjualannya jadi satu dan stok di web katalog berkurang sendiri."
3. **Tekankan "Tidak Ada Paksaan":**
   "Fitur inti pesanan Bapak/Ibu (Katalog) tetap beroperasi sebagai prioritas utama. Fitur Kasir dan Stok ini adalah fasilitas *complimentary* (tambahan gratis). Bapak/Ibu bebas mau langsung memakai fitur Kasirnya besok, atau fokus pakai katalognya dulu. Fiturnya sudah saya siapkan jika di masa depan bisnis bapak butuh pencatatan kasir digital."

---

## 🗣️ Contoh Skrip Percakapan (Roleplay)

**Anda (Developer):**
"Selamat pagi Pak/Bu. Terima kasih atas waktunya. Hari ini saya mau *update* progress aplikasi E-Commerce Fordza sesuai permintaan Bapak/Ibu sebelumnya, yaitu Sistem Katalog. Katalognya sudah berjalan lancar."

**Client:**
"Pagi mas. Syukurlah, gimana tuh tampilannya?"

**Anda (Developer):**
*(Tunjukkan aplikasinya).* "Nah, sambil merancang katalognya, saya memikirkan alur operasional toko Bapak. Daripada sekadar katalog pasif biasa, saya merancang *free upgrade* ke sistem ini. Saya tambahkan sistem Manajemen Stok dan Kasir (POS) internal sekaligus. Ini *pure* fasilitas tambahan dari saya."

**Client:**
"Wah, kasir? Memangnya harus pakai kasir segala ya mas? Kan awalnya saya cuma minta buat nampilin katalog aja biar orang bisa lihat referensi produk."

**Anda (Developer):**
"Betul Pak, tujuan utamanya tetap katalog web. Tapi masalah di toko biasa, kalau barangnya laku di toko *offline*, bapak harus menghapus/edit fotonya di web satu per satu agar update. Nah, dengan fitur Kasir tambahan ini, saat kasir toko Bapak input barang terjual, sistem otomatis akan memotong stok di Katalog Web saat itu juga. Pekerjaan bapak jadi 100% lebih ringan."

**Client:**
"Oh gitu... Lumayan juga ya biar nggak kerja dua kali. Nanti ngajarin anak buah saya ribet nggak ya?"

**Anda (Developer):**
"Sangat simpel Pak, dan nanti pasti saya ajarkan. Terus terang, penambahan fitur canggih ini juga sejalan dengan riset Skripsi S1 saya untuk merancang arsitektur sistem informasi tingkat perusahaan (*Enterprise*). Jadi hitung-hitung saling menguntungkan; Bapak dapat sistem yang jauh lebih mahal dan canggih dari sekadar website biasa secara gratis, dan saya punya bahan riset arsitektur yang berbobot untuk kelulusan saya."

**Client:**
"Oh buat skripsi juga to mas? Wah mantap-mantap, bagus mas kalau begitu saling bantu. Boleh deh."

---

## 🎯 Kesimpulan (Fase Awal)
Intinya: **Bungkus kebutuhan skripsi Anda sebagai VALUE (Nilai Tambah) untuk bisnis client.** 
Pemilik bisnis sangat menyukai kata kunci berikut:
- **"Otomatisasi"** (Website update sendiri tanpa kerja manual)
- **"Gratis / Free Upgrade"** (Mendapatkan lebih dari yang mereka bayar)
- **"Mencegah Kekecewaan Pelanggan"** (Stok di web akurat dengan di toko asli)

---

## 🛑 Skenario Terburuk: Client Tetap MENOLAK Fitur Kasir (POS)

Kadang ada client yang sangat kolot atau takut karyawannya kebingungan, sehingga mereka mungkin ngotot: *"Mas, saya pokoknya nggak mau ada kasir-kasiran. Saya cuma mau katalog titik. Menu kasirnya dibuang aja biar karyawanku nggak pusing."*

Bagaimana menyelamatkan **Syarat Skripsi Anda** jika ini terjadi?

**Strategi: "Penyembunyian Fitur" (Role-Based Access Control / Feature Flags)**
Jangan panik dan jangan menghapus proyek skripsi Anda. Katakan ini kepada client:
*"Baik Pak/Bu, saya sangat mengerti. Bapak hanya butuh katalog saja agar simpel. Nanti saya ubah akun login Bapak menjadi akun khusus 'Catalog Only', jadi semua tombol Kasir, Stok, dan Transaksi akan saya **sembunyikan** dari layar monitor Bapak supaya benar-benar bersih dan gampang dipakai karyawan. Tapi kodenya biarkan saya simpan 'di balik layar' tersembunyi untuk syarat penilaian kampus saya ya Pak."*

**Solusi Teknis Buat Anda (Nanti di Kodingan):**
1. Di database sistem Admin Anda, buat Sistem Role/Akses: `SUPER_ADMIN` (untuk Anda & Dosen Penguji) dan `CATALOG_ADMIN` (untuk Client Anda).
2. Di kode Frontend (Next.js), beri logika *kondisi* (if-else). Jika yang login adalah `CATALOG_ADMIN`, *hide/hilangkan* fitur Sidebar seperti "Kasir", "Riwayat Penjualan", dan "Manajemen Stok Gudang".
3. Dengan *Win-Win Solution* ini:
   - **Client Senang:** Tampilannya simpel 100% sesuai keinginan awal (cuma manajemen produk katalog).
   - **Dosen Skripsi Terkesima:** Saat Sidang Skripsi, Anda login ke web pakai akun `SUPER_ADMIN`, dan *BOOM!* Sistem Kasir (POS), Algoritma Stok, dan Ekosistem Enterprise-nya terbuka semua siap dinilai.

---

## ⚠️ Pemberitahuan Batasan Teknologi (Tech Limits Checklist)

Sangat penting untuk jujur namun tetap elegan mengenai batasan alat gratisan (*Free-Tier*) sejak awal, agar Anda tidak dituntut secara hukum hukum jika web sedang *down*.

**Cara Bilang ke Client:**
*"Pak/Bu, sebagai info tambahan, untuk tahap awal ini saya merakit web ini menggunakan server dan database modern dengan *Paket Starter Bisnis* (Gratis). Walaupun gratis, teknologinya sudah dipakai oleh startup-startup, jadi untuk lalu-lintas toko dalam setahun pertama ini pasti sangat cukup dan lancar. Namun, kalau ke depannya bisnis bapak meledak dan pengunjung webnya tembus ribuan orang per hari sampai datanya penuh, mungkin bapak perlu menyisihkan biaya *upgrade* langganan server (sekitar ratusan ribu per bulan) langsung dibayar ke vendor *Cloud*-nya, bukan ke saya. Tapi untuk sekarang, bapak terima beres gratis semua biaya bulanannya karena saya pakaikan kuota developer saya."*

**Catatan Batasan Teknis Tersembunyi (Khusus Pengetahuan Anda / Developer):**
1. **Server Host (Vercel Free Tier + Next.js):** Bandwidth bulanan dibatasi (100GB). Komunikasi *Frontend* ke *API Route* akan *timeout* (terputus otomatis) jika memproses komputasi algoritma lebih dari 10-15 detik. Eksekusi perhitungan jarak produk (*KNN Algorithm*) serta transaksi *Point of Sale* (POS) beroperasi dengan lancar dalam batasan ini asalkan kode tetap ringan.
2. **Database Relasional (Neon PostgreSQL Free Tier):** Ruang penyimpanan dibatasi 500MB per *project*. Angka 500MB ini **SANGAT MASIF** untuk murni baris data teks (bisa menampung hingga ratusan ribu baris riwayat transaksi POS Kasir, mutasi stok, dan rincian varian sepatu).
3. **Penyimpanan Foto (Supabase Object Storage Free):** Anda merancang arsitektur ideal dengan melempar file gambar keluar dari database utama menuju *Supabase Storage Buckets*. Batas ukuran penyimpanan gratisnya adalah 1GB (bisa memuat sekitar 2.000 hingga 5.000 foto sepatu jika sudah dikompres rata-rata 200KB/foto). Jika di masa depan limit 1GB ini penuh, ini adalah komponen pertama yang wajib dibebaskan.
