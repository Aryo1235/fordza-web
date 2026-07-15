# Flowchart Sistem Fordza-Web

Berikut adalah rancangan algoritma flowchart sistem Fordza-Web yang lengkap dengan detail halaman Landing Page, Kategori, About Us untuk Customer, serta detail menu Transaksi, Riwayat, Reprint, dan Void pada Kasir:

```mermaid
flowchart TD
    Mulai([Mulai]) --> BukaApp[Buka Aplikasi Fordza-Web]
    BukaApp --> TipeUser{Tipe Akses?}
    
    %% Alur Customer (Publik)
    TipeUser -- Customer (Publik) --> LandingPage["Landing Page / Home"]
    LandingPage --> NavigasiCust{"Pilih Menu?"}
    
    NavigasiCust -- About --> PageAbout["Halaman About Us"]
    NavigasiCust -- Kategori --> PageKategori["Halaman Kategori"]
    NavigasiCust -- Katalog --> Katalog["Halaman Katalog Produk"]
    NavigasiCust -- Promo --> PagePromo["Halaman Promo (Produk Diskon)"]
    
    Katalog --> LihatSepatu["Cari & Pilih Sepatu"]
    PagePromo --> LihatSepatu
    LihatSepatu --> Detail["Lihat Detail Produk & Varian"]
    Detail --> Rekomendasi["Sistem Rekomendasi (KNN)"]
    Rekomendasi --> InfoKatalog["Hanya Tampilan Katalog & Rekomendasi<br>(Tidak Ada Transaksi/Checkout Online)"]
    
    PageAbout --> SelesaiCust([Selesai])
    PageKategori --> SelesaiCust
    InfoKatalog --> SelesaiCust
    
    %% Alur Internal (Admin & Kasir)
    TipeUser -- Admin / Kasir --> HalamanLogin[Halaman Login]
    HalamanLogin --> InputCreds[/"Input Username & Password"/]
    InputCreds --> Validasi{"Role User?"}
    
    %% Alur Admin
    Validasi -- Admin --> DashAdmin[Dashboard Admin]
    DashAdmin --> NavAdmin{"Pilih Menu Dashboard?"}
    
    NavAdmin -- Kelola Konten & Katalog --> MenusKatalog["Produk, Kategori, Banner, Testimoni"]
    NavAdmin -- Aturan Ukuran & Diskon --> MenusAturan["Template Ukuran, Manajemen Promo"]
    NavAdmin -- Kontrol Inventaris --> MenusStok["Stok Opname, Histori Stok"]
    NavAdmin -- Pengguna & Otentikasi --> MenusUser["Management User"]
    NavAdmin -- Laporan & Audit POS --> MenusAudit["Riwayat Transaksi, Laporan Laci (Shifts), Laporan Omzet (Reports)"]
    
    MenusKatalog --> SelesaiAdmin([Selesai])
    MenusAturan --> SelesaiAdmin
    MenusStok --> SelesaiAdmin
    MenusUser --> SelesaiAdmin
    MenusAudit --> SelesaiAdmin
    
    %% Alur Kasir (POS Offline)
    Validasi -- Kasir --> DashKasir[Dashboard Kasir POS]
    DashKasir --> Shift["Buka / Tutup Shift"]
    
    DashKasir --> MenuKasir{"Pilih Menu?"}
    
    %% Transaksi Baru
    MenuKasir -- Transaksi Baru --> ScanProduk["Cari / Scan Produk"]
    ScanProduk --> CekStokKasir{"Stok<br>Tersedia?"}
    
    CekStokKasir -- Ya --> TransaksiKasir["Checkout & Pembayaran"]
    TransaksiKasir --> CetakStruk["Cetak Struk Invoice"]
    CetakStruk --> SelesaiKasir([Selesai])
    
    CekStokKasir -- Tidak --> BatalKasir["Batal"]
    BatalKasir --> SelesaiKasir
    
    %% Riwayat Transaksi (Void & Reprint)
    MenuKasir -- Riwayat Transaksi --> RiwayatTrans["Daftar Riwayat Transaksi"]
    RiwayatTrans --> AksiRiwayat{"Aksi Transaksi?"}
    
    AksiRiwayat -- Cetak Ulang --> Reprint["Cetak Ulang Invoice"]
    Reprint --> SelesaiKasir
    
    AksiRiwayat -- Void --> VoidTrans["Void Transaksi<br>(Butuh PIN Admin)"]
    VoidTrans --> SelesaiKasir
```
