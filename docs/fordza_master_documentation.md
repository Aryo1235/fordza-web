# Fordza POS: Master Project Documentation

Dokumen ini merupakan rekapan komprehensif seluruh pengembangan proyek **Fordza POS** dari awal hingga tahap saat ini. Dokumen ini dirancang sebagai referensi utama untuk memahami arsitektur, fitur, dan logika bisnis sistem.

## 1. Arsitektur Teknis
Sistem dibangun menggunakan **Next.js 14+ (App Router)** dengan pola arsitektur berlapis (**Layered Architecture**) untuk memastikan kode mudah dipelihara dan diuji:

- **Frontend (UI Components)**: Menggunakan Tailwind CSS, Shadcn UI, dan Lucide Icons. Mengikuti gaya desain *Premium Fordza* (vibrant colors, clean modern look).
- **Feature Layer (`/features`)**: Setiap modul (POS, Produk, User) dikelompokkan dalam folder fitur yang berisi komponen, hooks, API client, dan types secara atomik.
- **Service Layer (`/backend/services`)**: Berisi logika bisnis utama (misal: perhitungan harga, proses transaksi, transformasi data).
- **Repository Layer (`/backend/repositories`)**: Satu-satunya lapisan yang berkomunikasi langsung dengan database melalui **Prisma ORM**.
- **Database**: PostgreSQL dengan skema yang telah ternormalisasi untuk efisiensi tinggi.

## 2. Modul Utama & Fitur Unggulan

### 🛍️ Kasir & POS (Point of Sale)
- **Interactive POS**: Antarmuka belanja yang responsif dengan fitur pencarian cepat barang.
- **Cart System**: Pengelolaan keranjang belanja secara real-time.
- **Otorisasi Admin**: Integrasi verifikasi PIN Admin untuk pemberian diskon besar (di atas Rp 300.000).
- **Invoicing**: Pembuatan nomor invoice unik secara otomatis dan fitur cetak struk (Thermal & PDF).

### 🔍 AI & Product Recommendation
- **KNN (K-Nearest Neighbors) Algorithm**: Sistem rekomendasi produk serupa berdasarkan Kategori, Material, Gender, Tipe Produk, dan Harga.
- **Euclidean Distance**: Logika matematika untuk menghitung kemiripan antar produk guna meningkatkan *cross-selling*.

### 📦 Manajemen Stok & Audit Log
- **Sistem Audit Ketat**: Setiap perubahan stok dicatat dalam `StockLog` lengkap dengan alasan (Sale, Restock, Void, Adjustment) dan siapa Operatornya.
- **Eager Loading**: Query stok dioptimalkan untuk menghindari *N+1 Problem*, memastikan list histori tetap cepat meski data ribuan.

### 🔐 Keamanan & Autentikasi
- **JWT dengan Silent Refresh**: Sistem autentikasi berlapis yang menyimpan Access Token di memori (XSS protection) dan Refresh Token di HttpOnly Cookie.
- **Axios Interceptor**: Secara otomatis menangani perpanjangan sesi tanpa mengganggu interaksi pengguna.
- **Role-Based Access Control (RBAC)**: Pemisahan akses antara Admin (Dashboard penuh) dan Kasir (POS & Riwayat).

## 3. Desain & Estetika (Fordza Identity)
- **Color Palette**: Dominasi warna Stone, Amber, dan Emerald yang memberikan kesan "Handmade & Authentic".
- **Glassmorphism**: Penggunaan backdrop blur pada modal dan sidebar untuk kesan modern.
- **Premium Typography**: Menggunakan font Inter/Roboto dengan penekanan pada keterbacaan data angka.

## 4. Status Database (Prisma Models)
- **Product & ProductDetail**: Pemisahan data ringan (katalog) dan data berat (deskripsi/template size) untuk load speed.
- **Transaction & TransactionItem**: Relasi kuat untuk audit penjualan.
- **StockLog**: Buku besar (ledger) pergerakan barang.
- **Admin**: Entitas untuk Admin dan Kasir dengan sistem PIN keamanan.

## 5. Ringkasan Paginasi Global (Update Terbaru)
Seluruh daftar data (tabel) kini menggunakan komponen `<Pagination />` shared yang seragam, dengan tampilan **10 item per halaman** di semua menu (Produk, Transaksi, Audit Stok, Riwayat Kasir).

---
> [!NOTE]
> Project ini terus berkembang dengan fokus pada **Data Integrity** (Keakuratan Stok) dan **User Experience** (Kecepatan Transaksi).

*Dokumen ini diperbarui secara otomatis berdasarkan milestone terakhir proyek.*
