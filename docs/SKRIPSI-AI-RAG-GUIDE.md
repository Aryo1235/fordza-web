# Panduan Implementasi AI Assistant & Rekomendasi Pintar (RAG)
**Dokumen Referensi Khusus untuk Bab 3 & Bab 4 Skripsi / Tugas Akhir (BSI)**

Sistem rekomendasi sepatu dan asisten virtual (*AI Chatbot*) pada E-Commerce Fordza ini dirancang menggunakan arsitektur **RAG (Retrieval-Augmented Generation)** dan teknologi *Vector Database*, yang secara akademik termasuk dalam kategori **Mesin Pembelajaran Terapan (Applied Machine Learning)**.

---

## 1. Arsitektur & Teknologi Utama
Pondasi sistem ini menggunakan kombinasi *Modern Web Framework*, *Serverless SQL*, dan API Kecerdasan Buatan Generatif:

*   **Database Relasional & Vektor:** **Neon Tech (PostgreSQL)**. Alih-alih menyewa database vektor eksternal, kita mengaktifkan ekstensi `pgvector` bawaan Neon untuk menyimpan data transaksi SQL biasa sekaligus angka-angka AI dalam wadah yang sama.
*   **ORM (Object-Relational Mapping):** **Prisma**. Memfasilitasi komunikasi antara kode TypeScript dan database PostgreSQL, termasuk menjalankan *Raw SQL Queries* untuk pencarian berbasis Vektor (*Vector Search*).
*   **AI Model (Otak Generatif):** **Google Gemini API** atau **Groq API (Llama-3)**. Karena memiliki tingkat akurasi bahasa Indonesia yang luar biasa dan bebas biaya (100% *Free Tier* melimpah untuk mahasiswa/developer).
*   **Kerangka Penghubung (Framework):** **LangChain.js** atau **Vercel AI SDK**. Bertindak sebagai asisten pintar yang menghubungkan *Input* Pelanggan ➔ Pencarian Database ➔ Pengolahan Prompt ➔ dan Aliran Respon (*Streaming*).

---

## 2. Alur Pembelajaran (Data Ingestion) - Saat Admin Bekerja
Bagaimana data sepatu masuk ke otak AI? Proses ini **BUKAN** melatih otak AI dari nol (*fine-tuning*), melainkan menyuntikkan "Peta Makna" (Embeddings) dari database kita:

1. **Pembuatan Produk:** Admin memasukkan data sepatu baru (contoh: *"Sepatu Kulit Formal, cocok untuk rapat kantor"*).
2. **Kalkulasi Makna (Embedding):** Sistem Backend memanggil API (contoh: `text-embedding-3-small`) untuk memeras paragraf teks menjadi kumpulan titik koordinasi matematika raksasa dengan panjang 1.536 angka. Angka ini mewakili "sifat/ide" dari teks tersebut. (Contoh Vektor: `[0.012, 0.441, -0.999, ...]`).
3. **Penyimpanan:** Prisma menyimpan ID Sepatu, atribut teks biasa, dan deret Angka Vektor tadi ke dalam satu tabel yang sama di dalam Neon PostgreSQL.

---

## 3. Alur Tanya Jawab (RAG / Inference) - Saat Pelanggan Bertanya
Ini adalah mekanisme bagaimana AI Chatbot merekomendasikan sepatu dengan cerdas tanpa *ngarang* (berhalusinasi) dan tanpa menghabiskan kuota *Token API*:

1. **Pelanggan Bertanya:** *"Halo, ada sepatu enteng buat dipake presentasi bisnis gak?"*
2. **Penerjemahan Instan:** Pesan pelanggan ini secara diam-diam dikirim ke algoritma *Embeddings* untuk dicari letak "Titik Koordinat Maknanya".
3. **Penghitungan Matematika (Cosine Similarity):** 
   Database (Neon `pgvector`) diperintahkan untuk mencari sepatu mana di dalam gudang yang jarak titik panahnya (*Vector Distance*) paling bersinggungan dengan titik panah milik pertanyaan pelanggan. 
   *(Catatan Skripsi: Dosen sangat suka logika ini, karena komputer tidak mencari kata "presentasi", melainkan mencari makna konsep "Formal/Resmi". Sepatu pantofel pun langsung ditemukan).*
4. **Penyortiran Data (Retrieval):** Database mengambil 3 (Top 3) sepatu paling akurat tadi.
5. **Menyuntikkan Konteks (Augmented):** Sistem kita menggabungkan wujud teks ketiga produk itu menjadi sebuah instruksi rahasia (Prompt): 
   > *"Hai AI, pelanggan minta rekomendasi sepatu buat presentasi. Ini 3 koleksi terbaik kita: [Sepatu A, Sepatu B, Sepatu C]. Sapa pelanggan dengan manis dan pamerkan ketiga barang ini lengkap dengan harganya."*
6. **Balasan Final (Generation):** Model AI (Gemini/Llama) tidak perlu menebak isi toko Anda lagi. Ia membaca "contekan Prompt" tersebut dan membalas pelanggan menggunakan kalimat natural yang terdengar persis seperti *Customer Service* sungguhan.

---

## 4. Kenapa Metode Ini Layak Dapat Nilai Kelas Wahid Untuk Skripsi BSI? (Pros & Justification)
1. **Lebih Maju 5 Tahun Ke Depan:** Seringkali skripsi S1 berkutat dengan "Metode AHP", "Sistem Pakar KNN Tradisional", atau "Naive Bayes Klasik". Memilih metode **RAG & Embeddings berbasis Generative AI** menempatkan Anda di jajaran 1% pengembang (*Software Engineer*) di ranah akademis yang siap menghadapi industri modern masa kini.
2. **Pola Matematika yang Solid:** Skripsi menuntut pembuktian perhitungan Matematika. Alih-alih hitung-hitungan tebakan, Anda bisa mendemonstrasikan perhitungan formula *Euclidean Distance* atau *Cosine Similarity* pada dua kalimat langsung di Bab 3 (Perumusan Sistem).
3. **Efisiensi Sistem Nyata:** Anda tidak "menyuapi" 1.000 katalog sepatu kepada AI setiap detik (menghancurkan batas *Token* / Boros). Anda menerapkan filter *Smart Search* secara presisi, lalu membiarkan AI membacakan teks pemenangnya. Strategi ini sangat efisien, elegan, dan profesional.

---

*Disusun khusus untuk menancapkan "Bendera Kemenangan" Arsitektur Proposal Skripsi oleh Antigravity Assistant.* 🚀
