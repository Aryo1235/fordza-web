/**
 * Seed Data Dummy — Produk & Kategori (v2 - Integrasi Stok & Log)
 * Jalankan: npx tsx prisma/seed-products.ts
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Menghapus data lama (Clean State)...");
  
  // Hapus logs dulu karena ada relasi
  await prisma.skuStockLog.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariantImage.deleteMany();
  await prisma.productSku.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productDetail.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log("🌱 Mulai seeding produk dummy...\n");

  // ===========================================
  // 1. SEED KATEGORI
  // ===========================================
  const categoriesData = [
    { id: "cat-sneakers", name: "Sneakers", desc: "Sepatu kasual modern", order: 1 },
    { id: "cat-boots", name: "Boots", desc: "Sepatu boots tangguh", order: 2 },
    { id: "cat-formal", name: "Formal Shoes", desc: "Sepatu resmi & kantor", order: 3 },
    { id: "cat-sandals", name: "Sandals", desc: "Sandal santai premium", order: 4 },
    { id: "cat-loafers", name: "Loafers", desc: "Sepatu slip-on casual", order: 5 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        shortDescription: cat.desc,
        imageUrl: `https://placehold.co/400x400/1a1a2e/ffffff?text=${cat.name}`,
        order: cat.order,
      }
    });
  }
  console.log(`✅ ${categoriesData.length} kategori siap`);

  // ===========================================
  // 2. SIZE TEMPLATE
  // ===========================================
  let shoesTemplate = await prisma.sizeTemplate.upsert({
    where: { id: "tpl-shoes-man" },
    update: {},
    create: {
      id: "tpl-shoes-man",
      name: "Sepatu Pria (EU)",
      type: "shoes",
      sizes: ["39", "40", "41", "42", "43", "44"],
    }
  });

  // ===========================================
  // 3. PRODUK DUMMY
  // ===========================================
  const products = [
    {
      id: "prod-urban",
      code: "FDZ-URBAN-01",
      name: "Fordza Urban Sneakers",
      price: 350000,
      gender: "Man",
      cats: ["cat-sneakers"],
      colors: [
        { name: "Full Black", code: "URB-BLK" },
        { name: "Navy White", code: "URB-NVY" }
      ]
    },
    {
      id: "prod-boots",
      code: "FDZ-BOOTS-01",
      name: "Fordza Rugged Boots",
      price: 750000,
      gender: "Man",
      cats: ["cat-boots"],
      colors: [
        { name: "Tan Brown", code: "BT-TAN" }
      ]
    },
    {
      id: "prod-formal",
      code: "FDZ-EXEC-01",
      name: "Fordza Executive Oxford",
      price: 650000,
      gender: "Man",
      cats: ["cat-formal", "cat-loafers"],
      colors: [
        { name: "Glossy Black", code: "EXE-BLK" }
      ]
    }
  ];

  for (const p of products) {
    let totalProductStock = 0;

    // Create Product
    const createdProduct = await prisma.product.create({
      data: {
        id: p.id,
        productCode: p.code,
        name: p.name,
        price: p.price,
        productType: "shoes",
        gender: p.gender,
        isPopular: true,
        shortDescription: `Produk premium ${p.name} berkualitas tinggi.`,
        detail: {
          create: {
            description: `Detail lengkap untuk ${p.name}. Dibuat dari bahan pilihan dengan sol yang sangat nyaman.`,
            material: "Genuine Leather",
            sizeTemplateId: shoesTemplate.id,
          }
        },
        categories: {
          create: p.cats.map(cId => ({ categoryId: cId }))
        },
        images: {
          create: [{ url: `https://placehold.co/600x600/4a3b2e/ffffff?text=${p.name}`, key: `dummy/${p.id}.jpg` }]
        }
      }
    });

    // Create Variants & SKUs
    for (const color of p.colors) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          variantCode: color.code,
          color: color.name,
          basePrice: p.price,
          comparisonPrice: p.price * 1.2,
          discountPercent: 15,
          images: {
             create: [{ url: `https://placehold.co/600x600/4a3b2e/ffffff?text=${color.name}`, key: `dummy/${color.code}.jpg` }]
          }
        }
      });

      // Create SKUs for this variant
      for (const size of shoesTemplate.sizes) {
        const initialStock = Math.floor(Math.random() * 30) + 10; // 10-40 pcs
        totalProductStock += initialStock;

        const sku = await prisma.productSku.create({
          data: {
            variantId: variant.id,
            size: size,
            stock: initialStock,
          }
        });

        // CREATE SKU STOCK LOG (Penting agar History tidak kosong)
        await prisma.skuStockLog.create({
          data: {
            skuId: sku.id,
            delta: initialStock,
            currentStock: initialStock,
            size: size,
            color: color.name,
            type: "RESTOCK",
            notes: "Initial inventory seeding",
          }
        });
      }
    }

    // UPDATE TOTAL STOCK IN PRODUCT TABLE (Penting agar Admin & Katalog benar)
    await prisma.product.update({
      where: { id: createdProduct.id },
      data: { stock: totalProductStock }
    });

    // CREATE MAIN PRODUCT STOCK LOG
    await prisma.stockLog.create({
      data: {
        productId: createdProduct.id,
        delta: totalProductStock,
        currentStock: totalProductStock,
        type: "RESTOCK",
        notes: "Initial inventory seeding (Total)",
      }
    });

    console.log(`✅ ${p.name} created with ${totalProductStock} total units.`);
  }

  // ===========================================
  // 4. TESTIMONIALS
  // ===========================================
  console.log("\n🌱 Menambahkan Testimonial...");
  const firstProd = await prisma.product.findFirst();
  if (firstProd) {
    await prisma.testimonial.createMany({
      data: [
        { productId: firstProd.id, customerName: "Andi", rating: 5, content: "Luar biasa nyaman!" },
        { productId: firstProd.id, customerName: "Budi", rating: 4, content: "Kualitas oke, pengiriman cepat." },
      ]
    });
    
    // Update Rating
    await prisma.product.update({
      where: { id: firstProd.id },
      data: { avgRating: 4.5, totalReviews: 2 }
    });
  }

  console.log("\n✨ Seeding Selesai dengan Integrasi Stok!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
