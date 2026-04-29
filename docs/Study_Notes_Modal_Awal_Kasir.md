# Catatan Belajar: Konsep Modal Awal (Cash Float/Petty Cash) Sistem Kasir

## 1. Tujuan Operasional Modal Awal
- **Pemahaman Inti:** Digunakan untuk menjamin laci memiliki uang receh operasional guna memberikan kembalian fisik kepada *customer* sejak awal buka toko.
- **Analogi/Kasus:** Kasir datang pagi buka laci, manajer menaruh uang 500rb agar jika customer pertama belanja tunai Rp 100.000 memakai uang pecahan Rp 100.000, kasir tidak bingung memulangkan uang kembalian.

## 2. Implementasi Database (Schema Design)
- **Desain Entitas/Tabel Baru:** Untuk mencatat modal awal, sistem membutuhkan wadah berupa tabel penampung aktivitas siklus, contohnya `cashier_shifts`.
- **Inti Relasi Data:** Tabel `cashier_shifts` ini berelasi langsung dengan tabel penggunanya, yaitu **tabel `admins`**. Hal ini krusial untuk melacak siapa individu yang bertanggung jawab memegang uang/laci pada durasi waktu kerja tersebut.

## 3. Relasi Transaksi dan Audit Keuangan Kasir
- **Mengapa Transaksi Dihubungkan ke Shift (Bukan Diri Kasir)?** Logika dunia nyata: uang dari pelanggan dimasukkan ke Laci. Maka dalam skema Prisma, tabel `transactions` WAJIB diberi kolom (Foreign Key) `shift_id` yang menunjuk ke tabel `cashier_shifts`. Laci inilah yang kelak akan "diperiksa" isi total penambahan uangnya pada waktu akhir kerja (audit kelancaran tutup kasir).

## 4. UI/UX dan Best Practices (Next.js Application State)
- **Modal Penghalang Layar ("Open Shift Blocker"):** Saat pengguna login dan sistem membaca bahwa belum ada tabel `cashier_shifts` yang aktif di hari/jam tersebut, Front-end (Next.js Client Component) wajib menampilkan layar tipe *Overlay* atau *Modal*. Layar ini *memaksa* dan mengunci Kasir agar tidak bisa mengakses menu produk sama sekali sebelum mereka mengetikkan nominal Modal Awal.

## 5. Pertanggungjawaban (Accountability) Sistem
- **Siapa yang Menginput Modal?** DALAM KOMPUTER HARUS KASIR! (Menggunakan akun *login*-nya sendiri). Jika Admin/Manajer yang menginput di sistem dari belakang meja, namun uang fisik yang diserahkan kurang, Kasir akan menjadi korban salah tuduh (Defisit/Minus malam harinya).
- **Alur Penyelesaian SOP (Solusi Sebenarnya):** Sebelum Kasir mengetik nominal di UI 'Open Shift' tadi, Kasir di dunia nyata **wajib** murni menghitung lembar uang yang diberikan manajer di atas meja. Jika jumlahnya terbukti 500rb, barulah Sang Kasir mengetik '500000' di sistemnya. Ini menjadi sebuah Kontrak Digital: *"Saya, Kasir Budi, sadar telah menerima receh Rp 500.000 dan berani mempertanggungjawabkan laci ini."*

## 6. Solusi Filter Database & Anti-Fraud
- **Filter Query Prisma (Nested Query):** Walaupun transaksi menempel pada Laci (Shift), kita tetap bisa menarik data performa Kasir dengan *Nested Kueri*. Hubungannya menjadi: `Tarik semua Transaksi yang nempel di Shift yang nempel pada Admin ber-ID Budi`. (Relasi 3 entitas).
- **Menu Audit (Pencegahan Pencurian):** Untuk mencegah Kasir berbohong soal Modal Awal di Laporan Akhir, mutlak dibutuhkan **1 Menu Baru** di *Dashboard Admin / Manajer*. Di menu ini, Manajer bisa mengaudit setiap laci yang ditutup, dan kelak jika diperlukan, programmer bisa membangun fitur *Approval* (Kasir input angka -> Manajer Verifikasi sebelum sistem berjalan).

## 7. Denormalisasi DB dan Relasi Terpisah
- **Data Rangkap (`kasir_id` tetep ada di tabel Transaksi):** Adalah desain yang sangat sengaja di ranah industri. Demi tujuan *Analytics Report*. Jutaan histori struk bisa dirangkum dalam milidetik ke layar atasan tanpa perlu *Loading* akibat siksaan *Nested Joins* melewati tabel Shift.
- **Kekebalan Gudang (Stock Logs):** Rekaman keluar-masuk barang menggunakan kolumn tunggal `operator_id` (tidak bergantung ke shift apapun). Oleh karena itu, *bug* apapun atau keributan modal laci di area front-desk takkan merusak hitungan audit stok log murni di gudang komputer.

## 8. Arsitektur STI (Single Table Inheritance)
Berdasarkan kacamata *Senior Database Designer*, menggabungkan entitas pengguna Admin dan Kasir menjadi tabel tunggal `admins` (berpembeda Enum `Role`) disebut **Single Table Inheritance (STI)**.

### Plus Minus (Pros & Cons)
- **Kelebihan (PROS):** 
  1. **Fleksibilitas Jabatan:** Mudah memutasi "naik jabatan" Kasir menjadi Admin hanya via 1 kata Enum. Menghindari penghapusan relasi ribuan `Foreign Key` histori lama yang bergeser ke NULL.
  2. **Login Efisien:** Query ke server sangat ringan karena sistem API kredensial hanya perlu membidik 1 tempat untuk mencegat akses.
- **Kekurangan (CONS):**
  1. **Polusi Nullable:** Kolom khusus Manajer (misal: `audit_pin`) otomatis dipaksa kosong (NULL) saat baris itu diisi oleh profil Kasir, memicu pemborosan lebar DB.
  2. **Bencana Over-fetching:** Resiko fatal ketika programing mengembalikan sisa kolom secara membabi buta ke *Response Browser*.

### Contoh Bahaya Kueri (Best Practice)
**❌ YANG SALAH (Fatal Over-Fetching Data):**
```typescript
// JANGAN LAKUKAN INI DI API ROUTE UNTUK REST-API FRONTEND!
const badKasirData = await prisma.admin.findFirst({ 
    where: { username: "kasir-budi" } 
    // Mengembalikan properti: 'password', 'pin', dan data ghaib yang tak pantas ditransfer HTTP! BAHAYA!
});
```

**✅ YANG BENAR (Aman lewat Layer Select):**
```typescript
// INI YANG DIWAJIBKAN DI LAYER REPOSITORY FORDZA-WEB
const goodKasirData = await prisma.admin.findUnique({
    where: { username: "kasir-budi" },
    select: {
        id: true,
        username: true,
        name: true,
        role: true 
        // 🔒 Abaikan pemanggilan password dan kunci brankas PIN
    }
});
```
