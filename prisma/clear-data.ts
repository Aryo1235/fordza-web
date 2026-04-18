import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Sedang mengosongkan data database...");
  
  try {
    // Urutan penghapusan untuk menghindari error Foreign Key
    await prisma.transactionItem.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.skuStockLog.deleteMany();
    await prisma.stockLog.deleteMany();
    await prisma.productVariantImage.deleteMany();
    await prisma.productSku.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.testimonial.deleteMany();
    await prisma.productDetail.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.banner.deleteMany();
    
    // Opsional: Jika ingin hapus Admin juga, buka komentar di bawah:
    // await prisma.admin.deleteMany();
    
    console.log("✅ Semua data (Produk, Transaksi, Log, Kategori) berhasil dihapus!");
    console.log("ℹ️  Data Admin tetap tersimpan agar Anda bisa tetap login.");
  } catch (error) {
    console.error("❌ Gagal mengosongkan database:", error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
