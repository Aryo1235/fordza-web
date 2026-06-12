# Activity Diagrams - Fordza-Web

Dokumen ini berisi Activity Diagram (Diagram Aktivitas) menggunakan format **Mermaid** dengan visualisasi swimlane yang bersih, formal, dan rapi tanpa emotikon/emoji, disesuaikan dengan kebutuhan penulisan ilmiah/skripsi.

---

## 1. Activity Diagram: Transaksi Kasir (POS)

```mermaid
flowchart TD
    %% Styling Formal
    classDef actor fill:#f5f5f5,stroke:#333,stroke-width:1px;
    classDef system fill:#ffffff,stroke:#333,stroke-width:1px;

    subgraph Kasir [Kasir]
        K_Start([Mulai]) --> K_BukaShift[Buka Shift Kasir]
        K_BukaShift --> K_Scan[Scan Barcode / Cari Produk]
        K_Scan --> K_Varian[Pilih Varian Warna & SKU Ukuran]
        K_Varian --> K_Input[Masukkan ke Keranjang]
        
        K_Nominal[Input Nominal Uang Pembayaran] --> K_Checkout[Konfirmasi Checkout & Bayar]
        
        K_Struk[Ambil Struk & Berikan ke Customer] --> K_End([Selesai])
    end

    subgraph Sistem [Sistem]
        S_Validasi{Validasi Stok?}
        S_Diskon[Kalkulasi Harga & Diskon Promo]
        S_Log[Kurangi Stok & Catat Log]
        S_Invoice[Generate Invoice Thermal]
        S_Error[Menampilkan Peringatan Stok Habis]
    end

    %% Alur Antar Swimlane
    K_Input --> S_Validasi
    S_Validasi -- Ya --> S_Diskon
    S_Validasi -- Tidak --> S_Error
    
    S_Error --> K_Scan
    S_Diskon --> K_Nominal
    
    K_Checkout --> S_Log
    S_Log --> S_Invoice
    S_Invoice --> K_Struk

    class K_Start,K_BukaShift,K_Scan,K_Varian,K_Input,K_Nominal,K_Checkout,K_Struk,K_End actor;
    class S_Validasi,S_Diskon,S_Log,S_Invoice,S_Error system;
```

---

## 2. Activity Diagram: Pencarian Produk & Rekomendasi KNN (Customer)

```mermaid
flowchart TD
    %% Styling Formal
    classDef actor fill:#f5f5f5,stroke:#333,stroke-width:1px;
    classDef system fill:#ffffff,stroke:#333,stroke-width:1px;

    subgraph Customer [Customer]
        C_Start([Mulai]) --> C_Buka[Buka Katalog Produk Publik]
        C_Buka --> C_Lihat[Lihat Daftar Sepatu]
        C_Lihat --> C_Pilih[Klik / Pilih Salah Satu Sepatu]
        
        C_Detail[Lihat Detail Spesifikasi & Varian] --> C_Rekomendasi[Melihat Produk Rekomendasi Serupa]
        C_Rekomendasi --> C_End([Selesai])
    end

    subgraph Sistem [Sistem Rekomendasi KNN]
        S_Ambil[Ambil Data Utama Sepatu dari DB] --> S_Vektor[Ekstrak Vektor Fitur]
        S_Vektor --> S_Euclidean[Hitung Jarak Euclidean terhadap Produk Lain]
        S_Euclidean --> S_Sort[Urutkan Jarak Ascending & Ambil K-Terdekat]
        S_Sort --> S_Filter[Saring Produk Aktif & Sesuaikan Gender]
        S_Filter --> S_Tampil[Kirim Data Rekomendasi ke Layar]
    end

    %% Alur Antar Swimlane
    C_Pilih --> S_Ambil
    S_Tampil --> C_Detail

    class C_Start,C_Buka,C_Lihat,C_Pilih,C_Detail,C_Rekomendasi,C_End actor;
    class S_Ambil,S_Vektor,S_Euclidean,S_Sort,S_Filter,S_Tampil system;
```

---

## 3. Activity Diagram: Manajemen Data (Admin)

```mermaid
flowchart TD
    %% Styling Formal
    classDef actor fill:#f5f5f5,stroke:#333,stroke-width:1px;
    classDef system fill:#ffffff,stroke:#333,stroke-width:1px;

    subgraph Admin [Admin]
        A_Start([Mulai]) --> A_Buka[Buka Dashboard Admin]
        A_Buka --> A_Menu[Pilih Menu Manajemen Data]
        A_Menu --> A_Isi[Isi Form Data]
        A_Isi --> A_Simpan[Klik Tombol Simpan]
        
        A_Notif[Melihat Notifikasi Sukses] --> A_End([Selesai])
    end

    subgraph Sistem [Sistem CMS]
        S_Validasi{Validasi Input Zod?}
        S_Upload[Proses Upload Gambar ke AWS S3]
        S_Save[Simpan Data ke Database PostgreSQL]
        S_Respon[Berikan Respon Berhasil]
        S_Error[Tampilkan Error Validasi Form]
    end

    %% Alur Antar Swimlane
    A_Simpan --> S_Validasi
    S_Validasi -- Ya --> S_Upload
    S_Upload --> S_Save
    S_Save --> S_Respon
    S_Respon --> A_Notif
    
    S_Validasi -- Tidak --> S_Error
    S_Error --> A_Isi

    class A_Start,A_Buka,A_Menu,A_Isi,A_Simpan,A_Notif,A_End actor;
    class S_Validasi,S_Upload,S_Save,S_Respon,S_Error system;
```
