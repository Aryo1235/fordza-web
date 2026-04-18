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

## ⚠️ Cara Menjelaskan Batasan Teknologi (Analogi Toko)

Sangat penting untuk jujur mengenai batasan alat gratisan (*Free-Tier*) sejak awal agar ekspektasi client terjaga. Gunakan analogi **"Toko Fisik"** agar mereka langsung paham:

| Istilah Teknis | Analogi Toko (Bahasa Awam) | Skala Ukurannya (Biar Client Paham) |
| :--- | :--- | :--- |
| **Server Bandwidth** (100GB) | **Lebar Pintu Toko:** Kapasitas pengunjung yang bisa masuk lihat-lihat katalog. | **Sangat Luas:** Bisa menampung sekitar **50.000 - 80.000 pengunjung** per bulan. |
| **Database Storage** (500MB) | **Buku Nota/Laporan:** Kapasitas lembar catatan transaksi dan data pelanggan. | **Sangat Tebal:** Bisa mencatat hingga **200.000 transaksi** sukses. |
| **Object Storage** (1GB) | **Gudang Foto/Display:** Kapasitas berapa banyak foto sepatu yang bisa dipajang. | **Banyak:** Bisa memuat sekitar **3.000 - 5.000 foto produk** (HD). |
| **Server Timeout** (15 Detik) | **Kesabaran Pelayan:** Berapa lama pelayan toko boleh "berpikir" sebelum dianggap lemot. | **Standar:** Jika simpan data lebih dari **15 detik**, sistem batal otomatis agar antrian tidak macet. |

**Contoh Cara Menjelaskan Skalanya:**
> *"Pak/Bu, jangan khawatir soal angka teknisnya. Intinya, server ini bisa melayani sampai **50.000 orang lebih** yang liat-liat web Bapak/Ibu tiap bulan secara gratis. Terus, 'buku catatan' di dalamnya juga bisa nampung sampai **ratusan ribu nota penjualan**. Jadi, kapasitas ini sudah lebih dari cukup untuk toko yang lagi ramai sekalipun."*

---

## 🛠️ Catatan Teknis (Khusus Untuk Anda)

Tetap simpan detail ini sebagai panduan teknis Anda:

1. **Server (Vercel Free):** Limit bandwidth 100GB/bulan. (Hitungan: 100GB / 1MB rerata size halaman = 100.000 view).
2. **Database (Neon PostgreSQL):** Limit 500MB. (Satu baris data teks hanya ~1KB, jadi 500MB = 500.000 baris data).
3. **Penyimpanan Foto (Supabase Storage):** Limit 1GB gratis. Gunakan library kompresi gambar agar 1 foto tetap di bawah 200KB.
4. **Kecepatan Proses (Timeout):** Jika Anda membuat laporan tahunan yang sangat berat, usahakan prosesnya di-split atau dioptimasi agar tidak tembus 15 detik.
