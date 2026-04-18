import { prisma } from './lib/prisma';

async function main() {
  console.log("Menghapus data kotor...");

  try {
    // Menghapus histori transaksi kasir dummy untuk mencegah error relasi (Foreign Key)
    await prisma.transactionItem.deleteMany({});
    await prisma.transaction.deleteMany({});
    console.log("✅ Data Transaksi Kasir dibersihkan.");

    // Menghapus history log stok
    await prisma.stockLog.deleteMany({});
    await prisma.skuStockLog.deleteMany({});
    console.log("✅ Data histori Stok dibersihkan.");

    // Menghapus SEMUA PRODUK beserta Varian & SKU-nya (Cascade)
    await prisma.product.deleteMany({});
    console.log("✅ Semua Produk, Variant, dan SKU berhasil dihapus total!");
    
    console.log("Database sekarang kembali FRESH untuk testing.");
  } catch (error) {
    console.error("Gagal membersihkan data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
