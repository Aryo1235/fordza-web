# Dokumentasi Sistem Komprehensif: Katalog Digital & POS Terintegrasi — Fordza

Dokumen ini berisi arsitektur teknis menyeluruh, struktur *database*, hierarki direktori, hingga penjelasan implementasi algoritma **K-Nearest Neighbor (KNN)** pada sistem **Fordza**. Dokumen ini disusun khusus sebagai referensi pelengkap pembuatan laporan/skripsi/tugas akhir dengan standar **Enterprise Architecture**.

---

## 1. Konsep dan Arsitektur Sistem

Sistem **Fordza** adalah aplikasi berbasis *Web Omnichannel* yang dibangun menggunakan arsitektur modern untuk ekosistem *Retail*:

1.  **Katalog Digital (Frontend Publik):** Etalase virtual berkecepatan tinggi yang menampilkan detail produk, ketersediaan stok *real-time*, dan sistem rekomendasi **K-Nearest Neighbor (KNN)** untuk memberikan variasi pilihan kepada pelanggan secara proaktif ("Produk Serupa").
2.  **Sistem Kasir / Point of Sales (Backend Admin):** Aplikasi operasional staf toko untuk memproses transaksi. Fiturnya mencakup validasi stok, sistem keranjang pintar, perhitungan otomatis, dan pencetakan faktur berjalan (*Invoice*). 

Keduanya terhubung pada satu *Database* terpusat, memastikan sinkronisasi stok dan akurasi data rekomendasi tanpa ada latensi.

### Tech Stack Utama:
- **Framework Utama:** Next.js 15 (App Router Server Components)
- **Bahasa Pemrograman:** TypeScript (Strict Typing)
- **Arsitektur Backend:** 3-Layer Pattern (Controller - Service - Repository)
- **Arsitektur Frontend:** Feature-Sliced Architecture (Modular Features)
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Infrastruktur Gambar:** AWS S3 Bucket
- **Sistem Autentikasi:** JSON Web Token (Access & Refresh Token)
- **Styling:** Tailwind CSS & Lucide Icons

---

## 2. Struktur Direktori Utama (Folder Architecture)

Sistem ini menerapkan konsep pemisahan fokus (*Separation of Concerns*) dengan modul *Feature-Based* dan *3-Layer Backend*:

```text
e:\fordza-web\
├── app/                  # (Layer Controller / Routing)
│   ├── (admin)/          # Dashboard management
│   ├── (kasir)/          # Sistem POS (Point of Sales)
│   ├── (public)/         # Katalog pelanggan & Produk Serupa
│   └── api/              # API Route Handlers (Gerbang Masuk Data)
├── backend/              # (Layer Logic & Data Access)
│   ├── repositories/     # Data Access Layer (Murni Kueri Prisma)
│   └── services/         # Business Logic Layer (KNN, Transaksi, Validasi)
├── features/             # (Modular Frontend - Feature Sliced)
│   ├── auth/             # Manajemen sesi & login
│   ├── products/         # Pengelolaan produk & rekomendasi
│   ├── kasir/            # Keranjang & Checkout POS UI
│   ├── banners/          # Manajemen Promo
│   └── testimonials/     # Manajemen Review & Rating
├── components/           # (UI Shared)
│   └── shared/           # Komponen global (Button, Table, ImageUpload)
├── lib/                  # (Utility) API Config, S3 Helper, Prisma Client
└── prisma/               # (Database Definitions)
```

---

## 3. Penjelasan Arsitektur 3-Layer Backend

Untuk menunjang standar Enterprise, backend aplikasi Fordza dipisah menjadi 3 lapisan (layer) tanggung jawab:

1.  **Transport/Controller Layer** (Folder: `app/api/`):
    - Bertindak sebagai entry point HTTP.
    - Tugas: Menerima request, validasi header/token, parsing body, dan mengirim response JSON.
2.  **Service Layer** (Folder: `backend/services/`):
    - Berisi seluruh **Logika Bisnis** (Otak sistem).
    - Tugas: Validasi stok, kalkulasi harga, logika transaksi POS, dan implementasi algoritma KNN.
3.  **Repository Layer** (Folder: `backend/repositories/`):
    - Khusus untuk akses data langsung ke database melalui Prisma ORM.
    - Tugas: Menjalankan kueri CRUD murni tanpa mencampurkan logika bisnis.

---

## 4. Skema Database Lengkap & Relasi Tabel

Sistem ini menggunakan *Relational Database* terstruktur. Berikut adalah daftar tabel (Model Prisma), kolom utama, dan kardinalitas relasinya.

### A. Tabel Utama (Entitas Inti)
1.  **Tabel `Product` (`products`)**
    Menyimpan data *lightweight* untuk mempercepat tampilan katalog.
    - `id` (PK, CUID)
    - `name`, `short_description` (String)
    - `price` (Decimal)
    - `stock` (Integer) - *Otomatis berkurang saat POS memproses transaksi.*
    - `product_type`, `gender` (String) - *Digunakan untuk fitur KNN.*
    - `is_active`, `is_popular`, `is_bestseller` (Boolean)
    - **Relasi:** 1-to-1 dengan `ProductDetail`, 1-to-Many dengan `ProductImage` & `Testimonial`, Many-to-Many dengan `Category`.

2.  **Tabel `ProductDetail` (`product_details`)**
    Menyimpan spesifikasi teknis lengkap yang hanya dimuat saat pengunjung masuk ke halaman Detail Produk.
    - `id` (PK)
    - `product_id` (FK, Unique)
    - `description`, `care_instructions`, `notes` (Text)
    - `material`, `closure_type`, `outsole`, `origin` (String)
    - **Relasi:** 1-to-1 balik ke `Product`, Many-to-1 ke `SizeTemplate`.

3.  **Tabel `Category` (`categories`) & `ProductCategory` (Pivot)**
    Manajemen kategori produk. Karena 1 produk bisa masuk banyak kategori (formal & pantofel), digunakan tabel Pivot (Many-to-Many).
    - `id` (PK), `name` (String), `image_url` (String)
    - **Pivot Tabel:** Menyimpan `product_id` dan `category_id`.

4.  **Tabel `Admin` (`admins`)**
    Data autentikasi pengguna sistem.
    - `id` (PK)
    - `username`, `password` (Hash bcrypt)
    - `role` (Enum: `ADMIN`, `KASIR`)
    - **Relasi:** 1-to-Many ke `Transaction`.

### B. Tabel Transaksi (Sistem POS)
1.  **Tabel `Transaction` (`transactions`)**
    Rekam jejak setiap nota pembayaran (Faktur).
    - `id` (PK)
    - `invoice_no` (Unique) - *Generate otomatis.*
    - `total_price`, `amount_paid`, `change` (Decimal)
    - `status` (Enum: `PAID`, `VOID`)
    - `kasir_id` (FK) - Relasi ke tabel Admin (Kasir mana yang melayani).
    - **Relasi:** 1-to-Many ke `TransactionItem`.

2.  **Tabel `TransactionItem` (`transaction_items`)**
    Detil produk yang dibeli di dalam satu nota (Bisa banyak tipe produk).
    - `id` (PK)
    - `transaction_id` (FK)
    - `product_id` (FK)
    - `quantity` (Integer)
    - `price_at_sale` (Decimal) - *Mengunci harga asli. Jika harga produk naik besok, invoice hari ini tidak berubah nilainya.*
    - `product_name` (String)

---

## 4. Alur Kerja Modul Point of Sales (POS)

Modul POS memfasilitasi transaksi tatap muka dengan tingkat presisi yang setara dengan sistem *Enterprise*:
1.  **Select & Add**: Kasir memindai / mencari nama produk dan memasukkannya ke State React (Keranjang).
2.  **Logical Constraints**: Sistem mengecek keranjang `is_valid` (menolak kuantitas melebihi `product.stock`).
3.  **Payment Validation**: Input *amount_paid* (jumlah uang diterima) tidak boleh di bawah *total_price*. Jika valid, kembalian (*change*) otomatis terhitung.
4.  **Database Transaction (`$transaction`)**:
    - Tabel `Transaction` & `TransactionItem` diperbarui (Insert data).
    - Stok tabel `Product` di-*decrement* bersesuaian dengan kuantitas yang dibeli secara aman (mengunci row agar tidak ada *Race Condition*).

---

## 5. Implementasi AI K-Nearest Neighbor (Katalog Digital)

AI algoritma **K-Nearest Neighbor (KNN)** diaplikasikan murni berbasis *Content-Based Filtering*. Sistem merekomendasikan produk "serupa" secara matematis menggunakan variabel atribut.

### A. Parameter & Atribut Encoding:
Data di *database* harus dikonversi dari huruf menjadi angka untuk dapat diukur dengan matematika komputasi jarak *(Distance Formula)*.

| Atribut Database | Tipe Data Asal | Parameter ML | Metode Encoding/Konversi | Alasan Akademis |
| :--- | :--- | :--- | :--- | :--- |
| `categories` (Relasi) | String | Kategori (Array) | **One-Hot Encoding** `(0 / 1)` | Karena tipe datanya Nominal, menghindari komputer menyusun ranking (Ordinal Bias). |
| `material` (Detail) | String | Bahan Baku | **One-Hot Encoding** | Mengubah teks (Kulit, Kanvas) menjadi Matrix boolean setara (Ya=1, Tidak=0). |
| `product_type` (Tabel Utama) | String | Divisi Toko | **One-Hot Encoding** | Memastikan Aksesoris tidak direkomendasikan jika pencarian adalah Sepatu. |
| `gender` (Tabel Utama) | String | Kelompok User | **One-Hot Encoding** | Memberi jarak ekstrem antara Pria vs Wanita, tetapi mempertemukan di 'Unisex'. |
| `price` (Tabel Utama) | Decimal | Valuasi Nominal | **Min-Max Normalization** | Menciutkan harga (ratusan ribu/jutaan) ke rentang desimal `0.0` sampai `1.0` agar proporsinya tidak mendominasi variabel `0` & `1` dari atribut One-Hot lain. |

### B. Tahap Eksekusi Jarak Matematis
Setelah Vektor untuk ratusan produk selesai terbentuk secara dinamis, sistem menerapkan Teorema Pythagoras versi dimensi tinggi:

**Euclidean Distance:**
$$d(p, q) = \sqrt{\sum_{i=1}^{n} (p_i - q_i)^2}$$

*Semakin kecil rentang selisih dari jarak vektor produk utama (*p*) dan kandidat produk lain (*q*), maka sistem menyatakan produk itu secara fisik terbukti **"Serupa"**.*
Sistem lalu mengurutkan jarak dari terendah ke tinggi, dan memangkasnya menggunakan metode **Ranking K=4**, menampilkan 4 produk terakurat ke antarmuka katalog. 

---
*Dokumentasi Resmi Proyek Fordza 2026 — Disusun Oleh AI Assistant Antigravity.*

