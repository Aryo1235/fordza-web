import { PrismaClient } from "../../app/generated/prisma/client"; // Alamat diperbaiki dari backend/scripts/
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Inisialisasi Mesin Database Ala Fordza (Wajib ada Adapter di Prisma 7)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backfill() {
  console.log("🚀 Dimulai: Migrasi Data ke SkuSalesSummary (Mode High Performance)...");
  
  // 1. Ambil semua transaksi PAID (Sesuai pola Fordza)
  const transactions = await prisma.transaction.findMany({
    where: { status: "PAID" },
    include: { items: true },
  });

  console.log(`📋 Ditemukan ${transactions.length} transaksi untuk diproses.`);

  const aggregation: Record<string, any> = {};

  for (const trx of transactions) {
    // 🇮🇩 Normalisasi ke WIB 00:00:00
    const wib = new Date(trx.createdAt.getTime() + 7 * 60 * 60 * 1000);
    const dateObj = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), 0, 0, 0, 0));
    const dateKey = dateObj.toISOString();

    for (const item of trx.items) {
      const variantColor = item.variantColor || "-";
      const skuSize = item.skuSize || "-";
      const key = `${dateKey}_${item.productId}_${variantColor}_${skuSize}`;

      if (!aggregation[key]) {
        aggregation[key] = {
          date: dateObj,
          skuId: item.skuId,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode || "-",
          variantColor: variantColor,
          skuSize: skuSize,
          totalQty: 0,
          totalRevenue: 0,
          invoiceIds: new Set(),
        };
      }

      aggregation[key].totalQty += item.quantity;
      aggregation[key].totalRevenue += Number(item.priceAtSale) * item.quantity;
      aggregation[key].invoiceIds.add(trx.id);
    }
  }

  // 2. Bersihkan tabel summary
  await prisma.skuSalesSummary.deleteMany({});

  // 3. Masukkan data hasil agregasi
  const dataToInsert = Object.values(aggregation).map(entry => ({
    date: entry.date,
    skuId: entry.skuId,
    productId: entry.productId,
    productName: entry.productName,
    productCode: entry.productCode,
    variantColor: entry.variantColor,
    skuSize: entry.skuSize,
    totalQty: entry.totalQty,
    totalRevenue: entry.totalRevenue,
    totalOrders: (entry as any).invoiceIds.size,
  }));

  if (dataToInsert.length > 0) {
    await prisma.skuSalesSummary.createMany({
      data: dataToInsert,
    });
  }

  console.log(`✅ Selesai: Berhasil memigrasi ${dataToInsert.length} baris ringkasan ke SkuSalesSummary.`);
}

backfill()
  .catch(e => {
    console.error("❌ Error saat backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
