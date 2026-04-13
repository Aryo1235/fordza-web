# Catatan Optimasi Free Tier Fordza Web

Dokumen ini dipakai sebagai catatan internal supaya penggunaan Vercel, Neon, dan Supabase Object Storage tetap aman di free plan.

## 1. Batas Aman Data per Modul

| Modul                    |                          Aman |                            Mulai Berat |                  Perlu Dibatasi |
| ------------------------ | ----------------------------: | -------------------------------------: | ------------------------------: |
| Transaksi list           | 10-200 row per halaman/filter | 500-2.000 row total yang sering dibuka |     >5.000 row tanpa pagination |
| Riwayat kasir            |        10-100 row per halaman |                     500+ row per query | ribuan row tanpa filter tanggal |
| Report summary           |            1-200 row agregasi |                  500+ item/chart besar |        query full scan berulang |
| Report detail            |         10-300 row per filter |                   500-1.000 row export |        >2.000 row export sering |
| Produk                   |                   50-500 item |                            1.000+ item |         >5.000 item tanpa index |
| Stock log                |                   100-500 row |                             1.000+ row | >5.000 row tanpa filter tanggal |
| Testimoni                |                   100-500 row |                             1.000+ row |     ribuan row tanpa pagination |
| Banner/Kategori/Template |                   puluhan row |                            ratusan row |                      ribuan row |

### Patokan Cepat

- < 500 row: sangat aman
- 500-2.000 row: masih aman kalau ada pagination dan index
- 2.000-10.000 row: mulai berat, wajib optimasi
- > 10.000 row: jangan query atau export sekaligus di free plan

## 2. Batas Aman Gambar

- Ukuran aman upload: 1-2 MB per file
- Resolusi aman web: 1200-2000 px di sisi terpanjang
- Format disarankan: WebP dulu, lalu JPG/PNG bila perlu
- Jumlah gambar per produk: 4-6 gambar
- Gambar publik sebaiknya dirender dengan tag `img` biasa jika prioritas utama adalah hemat kuota Vercel

## 3. Planning Optimasi Prioritas

### Prioritas 1 - Wajib

- Kompres gambar sebelum upload
- Batasi ukuran file upload ke 2 MB atau kurang
- Tambahkan pagination di semua list besar
- Tambahkan filter tanggal untuk transaksi, report, dan stock log
- Pakai `img` biasa + `loading="lazy"` untuk gambar publik
- Hindari query yang mengambil semua data sekaligus

### Prioritas 2 - Sangat Disarankan

- Tambahkan index di kolom yang sering dipakai search/filter
- Cache data public yang jarang berubah seperti banner, kategori, dan produk unggulan
- Kurangi penggunaan `use client` di halaman yang tidak interaktif
- Pisahkan endpoint summary dan detail untuk laporan
- Batasi export maksimal per request

### Prioritas 3 - Nice to Have

- Buat export asynchronous jika data makin besar
- Tambahkan fallback/error message yang lebih jelas dari backend
- Tambahkan metadata SEO dinamis untuk halaman produk publik
- Tambahkan halaman testimoni publik

## 4. Checklist Implementasi

### Sudah Aman

- [x] Upload gambar ke object storage
- [x] Kompres gambar sebelum upload (jalur upload utama via komponen ImageUpload)
- [x] Validasi ukuran upload maksimum 2 MB di server
- [x] Pagination pada beberapa halaman list
- [x] Endpoint report summary dan detail dipisah
- [x] Auth admin dan middleware proteksi
- [x] Public API dan admin API dipisah

### Perlu Diperbaiki

- [ ] Homepage publik belum dibangun
- [ ] Metadata SEO dinamis belum lengkap
- [ ] Cache public data belum eksplisit
- [ ] Beberapa halaman masih client fetch penuh
- [ ] Halaman uji internal `app/test/page.tsx` belum pakai kompresi client

### Harus Diprioritaskan

- [x] Kompres gambar sebelum upload (jalur utama)
- [x] Batasi upload 1-2 MB per file
- [ ] Batasi jumlah gambar per produk
- [ ] Pagination semua list besar
- [ ] Index database untuk field search/filter
- [ ] Export dibatasi maksimal per request

## 5. Catatan Singkat Untuk Client

- Aplikasi ini aman untuk skala kecil sampai menengah.
- Supaya tetap hemat free tier, gambar harus dikompres, data besar harus dipagination, dan query harus dioptimasi.
- Export besar dan proses berat sebaiknya tidak dijalankan langsung di serverless tanpa pembatasan.

## 6. Prioritas Kerja Berikutnya

1. Rapikan homepage publik agar tidak terlalu bergantung pada komponen berat.
2. Tambahkan SEO dinamis di halaman produk publik.
3. Buat cache atau lazy fetch untuk data public yang sering dibuka.
4. Audit semua export agar ada batas row maksimal.
5. Tambahkan index di database untuk kolom search/filter yang sering dipakai.
