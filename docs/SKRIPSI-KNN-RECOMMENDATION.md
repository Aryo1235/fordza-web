# Panduan Penjelasan Sistem Rekomendasi "Produk Serupa" (K-Nearest Neighbor)
**Dokumen Referensi Khusus untuk Bab 3 & Bab 4 Skripsi / Tugas Akhir (BSI)**

File ini berisi alur logika dan penjelasan metode algoritma **K-Nearest Neighbor (KNN)** yang digunakan pada halaman **Detail Produk** di aplikasi E-Commerce Fordza.

Sistem pada halaman Detail Produk **TIDAK** menggunakan *Term Frequency-Inverse Document Frequency (TF-IDF)* ataupun *Vector Database Generative AI (RAG)*. Sistem ini murni menggunakan pendekatan **Content-Based Filtering (Penyaringan Berbasis Konten)** dengan perhitungan matematika klasik **(Euclidean Distance)** yang dihitung secara *real-time*.

---

## 1. Bagaimana Sistem Bekerja (Alur Proses)

Sistem bekerja dengan cara "menerjemahkan" atribut fisik sebuah sepatu menjadi angka-angka, lalu membandingkannya dengan sepatu lain. Berikut adalah langkah-langkah sistematisnya sesuai dengan skrip yang ada pada `lib/knn.ts`:

### Langkah 1: Pengumpulan Data Fitur (Feature Extraction)
Saat pelanggan membuka halaman sepatu "Pantofel Kulit Hitam" (Produk Target), sistem akan menarik seluruh data sepatu dari *database* (Prisma). Fitur yang diambil dan dianalisis **bukan kata-kata deskripsi**, melainkan 5 atribut inti pembentuk sifat produk (*DNA Produk*):
1. **Kategori** (Misal: Sepatu Formal, Pantofel)
2. **Material** (Misal: Kulit Sapi Asli)
3. **Gender** (Misal: Pria, Wanita, Unisex)
4. **Tipe Produk** (Misal: Shoes, Apparel, Accessories)
5. **Harga** (Misal: Rp. 500,000)

### Langkah 2: Proses "Label Encoding" (Mengubah Teks ke Angka)
Karena komputer (matematika) tidak bisa menghitung teks "Kulit Sapi Asli", teks tersebut harus diubah menjadi angka (*Index*).
*   **Encoding Kategori:** Jika sistem menemukan kategori baru, akan diberi indeks numerik (0, 1, 2, dst). Jika satu sepatu punya banyak kategori, nilainya akan **dirata-rata**.
    *Contoh: Kategori Formal (0) & Pantofel (2). Maka `(0 + 2) / 2 = 1.0`.*
*   **Encoding Material:** Sama seperti kategori, bahan kulit sapi diindeks sebagai `0`, bahan kanvas `1`, dan seterusnya.

### Langkah 3: Proses "Min-Max Normalization" (Normalisasi Skala)
Atribut Harga tidak bisa langsung dimasukkan karena angkanya jutaan (terlalu besar dan akan merusak hitungan jarak matematika terhadap indeks kategori yang hanya puluhan).
Oleh karena itu, sistem menggunakan rumus skala rasio `(Nilai - Nilai Terendah) / (Nilai Tertinggi - Nilai Terendah)`.
*   Hasilnya: Sepatu paling murah di toko akan bernilai `0.0`, dan sepatu paling mahal akan bernilai `1.0`. Harga lainnya berada di pecahan (misal `0.4`).

### Langkah 4: Pembuatan Vektor Fitur (Multi-Dimensi One-Hot)
Setelah semua atribut Nominal dirubah menjadi *Array Biner* (One-Hot `1`/`0`), sepatu tersebut kini direpresentasikan menjadi bentuk **Vektor Adaptif Multi-Dimensi** dengan blok rentang format: `[Data Kategori, Data Material, Data Gender, Data Tipe, Harga]`.
*Contoh Sepatu Pantofel tadi mungkin berbentuk array belasan dimensi: `[1, 1, 0, 1, 0, 1, 0, 1, 0, 0.4]`*

### Langkah 5: Perhitungan Jarak (Euclidean Distance) & KNN
Sistem sekarang menghitung "seberapa jauh jarak" antara vektor Produk Target dengan ratusan vektor sepatu lainnya di dalam toko menggunakan rumus Teorema Pythagoras **Euclidean Distance**:
`Jarak = Akar Kuadrat dari ((X1 - X2)² + (Y1 - Y2)² + (Z1 - Z2)²)`

Setelah jarak ke SEMUA sepatu dihitung, jarak diurutkan dari yang terkecil hingga terbesar (di-Sorting).
**K-Nearest Neighbor (KNN)** berjalan dengan cara mengambil sejumlah "K" produk dengan jarak paling dekat (Paling Mirip). Pada aplikasi ini, **K = 4**, yang berarti sistem menampilkan 4 produk yang karakteristiknya paling menyerupai Produk Target.

---

## 2. Tabel Perbandingan Metode Rekomendasi

Sangat bagus untuk disisipkan di skripsi agar Dosen Penguji tahu bahwa Anda paham betul alasan memilih suatu algoritma untuk kasus yang berbeda, dan tidak sekadar menempel kode.

| Aspek Penilaian | K-Nearest Neighbor + Content-Based (KNN) | TF-IDF (Term Frequency-Inverse Document Frequency) | AI Vector Embeddings (RAG / LLM) |
| :--- | :--- | :--- | :--- |
| **Deskripsi Utama** | Menghitung jarak kemiripan kembaran atribut produk (kategori, material, harga). | Menghitung frekuensi kemunculan kata pada judul/deskripsi *(Keyword Extraction)*. | Mengubah kalimat utuh (makna dan konteks) menjadi ribuan dimensi vektor AI buatan Google/OpenAI. |
| **Digunakan Pada** | Halaman Detail Produk ("Produk Serupa"). | Biasanya untuk pencarian (*Search Bar*) berbasis kata kunci statis tradisional. | Halaman Chatbot Asisten AI Interaktif. |
| **Data yang Dideteksi** | Angka (*Integer/Decimal/Float*). | Teks (*String* & Sinonim sederhana). | Konsep Kalimat (Memahami "Anti Hujan" = "Waterproof"). |
| **Kelebihan** | Sangat ringan, cepat, ideal untuk *Real-Time Recommendation*, karena langsung dieksekusi oleh Server-Side TypeScript tanpa API Eksternal. | Mudah diimplementasikan, tanpa model matematika rumit, ringan secara CPU. | Sangat canggih, mengerti bahasa manusia (*Natural Language*), hasil persis seperti otak penjaga toko manusia. |
| **Kekurangan** | Tidak akan berfungsi jika 2 produk punya kemiripan nama tetapi tidak punya kategori/bahan yang sama. | Sering gagal jika pelanggan '*typo*' (salah ketik) atau memakai bahasa gaul yang tidak ada di *database* (misal: "Kece", "Keren"). | Cukup lambat (karena butuh *request API* eksternal), membutuhkan kuota *Token API*, database harus canggih (`pgvector`). |
| **Kesimpulan (Status Digunakan)** | **YA (Digunakan di Detail Produk via Fungsi pure TypeScript).** | **TIDAK DIGUNAKAN** karena rentan *Error* saat typo, akurasi kurang baik untuk e-commerce modern. | **YA (Digunakan di Chatbot AI).** Menggunakan `pgvector` & Prisma. |

---

## 3. Justifikasi & Keuntungan (Bahan Sidang Skripsi)

Mengapa E-Commerce ini menggunakan **KNN berpadu dengan Vektor 5 Fitur Sederhana** untuk rekomendasi produk serupa (K=4), tetapi tidak menggunakan API Gemini (RAG)?

1. **Kecepatan Tampilan / UX (*User Experience*):** Ketika user memencet detail produk, data "Produk Serupa" harus muncul instan (< 0.5 detik). Jika memakai API Gemini setiap kali halaman ter-*load*, UI akan sangat lambat *loading*-nya, dan *Token API/Quota Limit* Anda akan cepat habis.
2. **Efisiensi Beban (*Compute Efficiency*):** K-Nearest Neighbor adalah algoritma klasik, stabil, dan bisa dijalankan pada memori RAM yang kecil. Sangat tepat digunakan khusus meranking skor kesamaan bahan baku `(Material)` dan `(Harga)` antar produk.
3. **Pembagian Peran (Konsep *Hybrid* yang Sangat Elegan):**
   *   *Sistem KNN (Matematika Ringan)* → Digunakan pada halaman pasif untuk memancing mata pengguna (Detail Produk).
   *   *Sistem RAG (Matematika Berat / AI)* → Digunakan pada percakapan interaktif (Chatbot).
   Perpaduan dua sistem ini menjadikan arsitektur skripsi Anda level "Advance Web Dev / Pro", karena tidak membabi-buta menyerahkan semua pekerjaan sistem ke pihak ke-3 (API Google).

---
*Disusun oleh Antigravity Assistant untuk membantu penjelasan di Skripsi S1 Informatika.* 🧠
