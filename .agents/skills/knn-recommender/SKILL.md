---
name: knn-recommender
description: "Panduan dan standar dalam mengimplementasikan, memodifikasi, dan mengoptimalkan sistem rekomendasi produk K-Nearest Neighbors (KNN) di proyek Fordza Web. Gunakan skill ini setiap kali user meminta penyesuaian pada algoritma KNN, matriks fitur produk, penghitungan jarak Euclidean, atau endpoint antarmuka katalog produk yang menggunakan fitur rekomendasi."
---

# KNN Recommender System Expert

Skill ini memandu AI untuk memastikan bahwa algoritma rekomendasi K-Nearest Neighbors (KNN) di proyek Fordza Web (yang merupakan materi utama Skripsi) selalu mengikuti arsitektur dan standar logika yang telah ditetapkan. 

Sistem ini digunakan untuk **merekomendasikan produk terkait kepada pelanggan katalog secara real-time** melalui Next.js API Routes.

## 1. Arsitektur Vektor & Fitur (Matrix Dimensions)
Saat mengekstrak atau menambahkan vektor baru (di dalam berkas `lib/knn.ts`), selalu ingat urutan pemetaan dimensi berikut:
Fitur yang diekstrak untuk pembobotan matriks produk wajib meliputi (tapi tidak terbatas pada):
- **Kategori Produk** (`categoryIds`)
- **Material** (`materials` - misal: Leather)
- **Gender** (`genders` - misal: Man / Woman)
- **Tipe Produk** (`types` - misal: Shoes / Casual)
- **Skala Harga** (`price`): Selalu ingat bahwa harga WAJIB dinormalisasi menggunakan min-max scaler ke rentang float `0.0` (termurah) hingga `1.0` (termahal) untuk mencegah bobot harga mendominasi skor KNN.

*Semua fitur kategorikal harus di-encode (one-hot encoding / 0 atau 1) saat masuk ke dalam array vektor.*

## 2. Penghitungan Jarak (Distance Metric)
- Proyek/Skripsi ini HANYA menggunakan **Euclidean Distance**.
- Jangan pernah mengusulkan atau merubah perhitungan menggunakan Cosine Similarity atau Manhattan kecuali diminta secara eksplisit oleh user untuk keperluan komparasi eksperimen skripsi.
- Jarak Euclidean semakin KECIL berarti produk semakin MIRIP (Rekomendasi terbaik = Jarak terdekat ke 0).

## 3. Proses Komputasi Real-time
- Rekomendasi dihitung **secara real-time** di runtime backend (Next.js API Routes).
- Data pembanding harus ditarik terlebuh dahulu menggunakan **Prisma Client** (misal: mengambil data 10-50 produk teratas untuk meminimalisir lag/Overfetch jika total data membesar).
- Setelah array data Prisma diterima, ubah mereka ke dalam vektor matematis lewat `buildProductVectors`.
- Kemudian iterasi perhitungannya terhadap produk *Seed* (produk yang saat ini sedang dilihat oleh pelanggan) untuk mendapatkan Top 5 produk terdekat.

## 4. Cara Menangani Request Seputar KNN
Jika user berkata *"Tolong tambahkan variabel asal_gudang ke dalam sistem KNN"*:
1. Ubah ekstraksi di file `lib/knn.ts` pada method `extractUniqueDimensions`.
2. Ubah `buildProductVectors` untuk memasukkan dimensi fitur baru.
3. Pastikan API Next.js melempar (*inject*) data `asal_gudang` dari Prisma ke fungsi KNN.

## 5. Pesan kepada AI (Instruksi Ketat)
Jangan menggunakan library eksternal (seperti scikit-learn-JS dll) karena ini adalah sistem buatan tangan (manual) yang dibuat spesifik untuk menunjukkan algoritme inti di depan dosen penguji. Pertahankan logika TypeScript mentahnya kecuali Anda disuruh melakukan refactor tanpa mengubah struktur output.
