# Studi Kasus: Kenapa One-Hot Encoding Jauh Lebih Baik dari Label Encoding
**Dokumen Pembelajaran & Persiapan Sidang Skripsi (Fitur Produk Serupa)**

## 1. Studi Kasus: Simulasi 1 Produk
Mari kita bandingkan bagaimana **Sepatu Pantofel Kulit** diproses oleh algoritma matematika menggunakan dua teknik *Encoding* (Penerjemahan Teks ke Angka) yang berbeda.

Misalkan kita punya **3 Kategori Sepatu** di toko:
A. `Formal`
B. `Sepatu Tali`
C. `Olahraga`

Misalkan kita punya **3 Material (Bahan) Sepatu**:
A. `Kulit Sapi`
B. `Kanvas`
C. `Suede`

Produk Studi Kasus: **"Sepatu Pantofel Klasik"** (Kategori: Formal & Sepatu Tali, Material: Kulit Sapi, Harga: Rp. 500,000 / *Harga setelah Normalisasi Max-Min* = `0.5`).

---

### Skenario A: Menggunakan LABEL ENCODING (Metode Lama - Kurang Akurat)
Pada *Label Encoding*, komputer memaksa nama kategori berubah menjadi tingkatan angka (Ranking) berurutan.
* Formal = `0`
* Sepatu Tali = `1`
* Olahraga = `2`

* Kulit Sapi = `0`
* Kanvas = `1`
* Suede = `2`

Sistem membaca Sepatu Pantofel kita punya 2 kategori (Formal & Sepatu Tali), sehingga rumusnya dirata-rata secara mentah: `(0 + 1) / 2 = 0.5`.
Sedangkan angka Material Kulit Sapi miliknya adalah `0`.

**Hasil Akhir Array Vektor Label Encoding (Misalkan kita paksakan juga untuk Gender dan Tipe):**
`[0.5, 0, 0, 0, 0.5]` -> `[Angka Kategori, Angka Material, Angka Gender, Angka Tipe, Skala Harga]`

❌ **Di mana Kesalahan Matematisnya?**
Jika Anda mengeksekusi rumus jarak Pythagoras (*Euclidean Distance*), sepatu ini akan dihitung komputer sebagai sepatu yang "mendekati" nilai Kategori `Olahraga (2)`. Mengapa? Karena nilai rata-rata tadi ditarik-ulur dalam satu spektrum penggaris yang sama. 
Dosen penguji akan menyebut kesalahan ini dengan istilah *Artificial Ordinality Bias* (mengasumsikan data Nominal sebagai urutan pangkat). Pantofel tidak memiliki pangkat lebih tinggi maupun rendah dibandingkan Olahraga! Angka 0 dan 2 tidak bisa begitu saja jadi patokan jarak.

---

### Skenario B: Menggunakan ONE-HOT ENCODING (Metode Baru - Sangat Presisi)
Pada *One-Hot Encoding*, komputer memperlakukan semua data kategori dan material secara **SETARA dan ADIL**. Konsepnya adalah menghancurkan urutan, dan mengubah wujudnya menjadi pernyataan tegas: *"YA atau TIDAK" (1 atau 0)*.

Kolom Kategori akan dibelah menjadi 3 dimensi unik: `[Is_Formal, Is_Sepatu_Tali, Is_Olahraga]`
Kolom Material akan dibelah menjadi 3 dimensi unik: `[Is_Kulit, Is_Kanvas, Is_Suede]`

Mari proses Sepatu Pantofel kita (Formal & Sepatu Tali, Kulit Sapi) dengan adil:
Pernyataan Kategori: `[1, 1, 0]` *(Apakah Formal? YA. Apakah Tali? YA. Apakah Olahraga? TIDAK)*
Pernyataan Material:  `[1, 0, 0]` *(Apakah Kulit? YA. Apakah Kanvas? TIDAK. Apakah Suede? TIDAK)*

**Hasil Akhir Array Vektor One-Hot (Belasan Dimensi Sempurna):**
`[1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0.5]` -> `[Kategori(3), Material(3), Gender(2), Tipe(2), Harga(1)]`
*(Asumsi Gender ada Pria & Wanita, Tipe ada Formal & Kasual)*

✅ **Mengapa Teknik Ini Level Skripsi Nilai Mahkota (A+)?**
Sekarang, jika ada sepatu *Running* berbahan Kanvas: `[0, 0, 1, 0, 1, 0, 0.5]`.
Sistem menghitung perbedaan ruang Vektor tidak berdasarkan skor urutan (2 vs 0), melainkan *100% Exact Matching Coordinate* menggunakan Euclidean Distance murni. Tidak ada asumsi paksaan "Kulit itu lebih dekat dengan Kanvas karena selisih angkanya 1". Jaraknya mutlak adil!

---

## 2. Refactoring (Perombakan Kode Skripsi Anda)
Saya (*AI Assistant*) telah merombak 2 *file* inti rekomendasi produk *E-Commerce* ini:
1. `lib/knn.ts`: Mengganti fungsi purba menjadi fungsi cerdas `extractUniqueDimensions`, yang mendeteksi otomatis **5 Atribut Inti** (Kategori, Material, Gender, Tipe Produk, Harga) dari *Database*, lalu memecahnya menjadi sistem tabel Biner `(0 & 1)` saat pembentukan Vektor berlangsung (pembelahan *Array* Adaptif).
2. `services/recommendation.db.ts`: Mengubah *query* Prisma untuk juga menarik data `gender` dan `productType`, sehingga begitu halaman produk detail dikunjungi oleh '*User*', sistem seketika memetakan Data *Database Relasional* menjadi Angka *Multi-Dimensi One-Hot Encoding* untuk diumpankan ke algoritma *K-Nearest Neighbor* secara instan.

**Kata Kunci (Template Jawaban untuk Dosen Penguji):** 
>"Sistem algoritma K-Nearest Neighbor (KNN) pada proyek kami tidak menggunakan Label Encoding biasa, melainkan menyematkan One-Hot Encoding Pipeline *Real-Time* menggunakan TypeScript. Keputusan arsitektur ini diambil secara sadar agar memusnahkan **Ordinal Bias** saat penghitungan *Euclidean Distance* karena tipe data Atribut Sepatu adalah data Nominal (bukan kategori berurutan)." 
