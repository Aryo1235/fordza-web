/**
 * Seed Data Dummy — Produk & Kategori
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
  console.log("🌱 Mulai seeding produk dummy...\n");

  // ===========================================
  // 1. SEED KATEGORI
  // ===========================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "cat-sneakers" },
      update: {},
      create: {
        id: "cat-sneakers",
        name: "Sneakers",
        shortDescription: "Sepatu kasual untuk sehari-hari",
        imageUrl: "https://placehold.co/400x400/1a1a2e/ffffff?text=Sneakers",
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-boots" },
      update: {},
      create: {
        id: "cat-boots",
        name: "Boots",
        shortDescription: "Sepatu boots tangguh dan stylish",
        imageUrl: "https://placehold.co/400x400/16213e/ffffff?text=Boots",
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-formal" },
      update: {},
      create: {
        id: "cat-formal",
        name: "Formal Shoes",
        shortDescription: "Sepatu formal untuk acara resmi",
        imageUrl: "https://placehold.co/400x400/0f3460/ffffff?text=Formal",
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-sandals" },
      update: {},
      create: {
        id: "cat-sandals",
        name: "Sandals",
        shortDescription: "Sandal nyaman untuk santai",
        imageUrl: "https://placehold.co/400x400/533483/ffffff?text=Sandals",
        order: 4,
      },
    }),
    prisma.category.upsert({
      where: { id: "cat-loafers" },
      update: {},
      create: {
        id: "cat-loafers",
        name: "Loafers",
        shortDescription: "Sepatu slip-on casual-formal",
        imageUrl: "https://placehold.co/400x400/2b2d42/ffffff?text=Loafers",
        order: 5,
      },
    }),
  ]);

  console.log(`✅ ${categories.length} kategori siap\n`);

  // ===========================================
  // 2. SEED SIZE TEMPLATE (pastikan ada)
  // ===========================================
  let shoesTemplate = await prisma.sizeTemplate.findFirst({
    where: { type: "shoes" },
  });

  if (!shoesTemplate) {
    shoesTemplate = await prisma.sizeTemplate.create({
      data: {
        name: "Sepatu Pria Standard (EU)",
        type: "shoes",
        sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
      },
    });
    console.log("✅ Size template dibuat\n");
  }

  // ===========================================
  // 3. SEED PRODUK (10 Produk Dummy)
  // ===========================================

  const productsData = [
    {
      id: "prod-001",
      name: "Fordza Urban Sneakers",
      shortDescription: "Sneakers kasual dengan desain modern untuk sehari-hari.",
      price: 350000,
      productType: "shoes",
      gender: "Man",
      isPopular: true,
      isBestseller: true,
      isNew: false,
      avgRating: 4.5,
      totalReviews: 28,
      material: "Canvas",
      closureType: "Tali",
      outsole: "Rubber",
      origin: "Bandung, Indonesia",
      description: "Sneakers kasual yang cocok dipakai sehari-hari. Desain urban modern dengan bahan canvas berkualitas tinggi. Sol karet yang empuk dan tahan lama.",
      categoryIds: ["cat-sneakers"],
      imageUrl: "https://placehold.co/600x600/1a1a2e/ffffff?text=Urban+Sneakers",
    },
    {
      id: "prod-002",
      name: "Fordza Classic Leather Boots",
      shortDescription: "Boots kulit asli dengan konstruksi kokoh.",
      price: 750000,
      productType: "shoes",
      gender: "Man",
      isPopular: true,
      isBestseller: false,
      isNew: false,
      avgRating: 4.8,
      totalReviews: 15,
      material: "Genuine Cow Leather",
      closureType: "Tali",
      outsole: "TPR",
      origin: "Garut, Indonesia",
      description: "Boots klasik dari kulit sapi asli Garut. Dibuat dengan teknik handmade dan konstruksi blake stitch yang kokoh. Cocok untuk gaya rugged.",
      categoryIds: ["cat-boots"],
      imageUrl: "https://placehold.co/600x600/16213e/ffffff?text=Leather+Boots",
    },
    {
      id: "prod-003",
      name: "Fordza Executive Oxford",
      shortDescription: "Sepatu formal oxford untuk profesional muda.",
      price: 650000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: true,
      isNew: false,
      avgRating: 4.7,
      totalReviews: 22,
      material: "Genuine Cow Leather",
      closureType: "Tali",
      outsole: "Leather Sole",
      origin: "Garut, Indonesia",
      description: "Sepatu oxford formal dari kulit sapi premium. Finishing glossy dengan sol kulit asli. Sempurna untuk acara formal dan dunia kerja.",
      categoryIds: ["cat-formal"],
      imageUrl: "https://placehold.co/600x600/0f3460/ffffff?text=Executive+Oxford",
    },
    {
      id: "prod-004",
      name: "Fordza Sport Runner",
      shortDescription: "Sneakers ringan untuk aktivitas olahraga ringan.",
      price: 280000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: false,
      isNew: true,
      avgRating: 4.2,
      totalReviews: 8,
      material: "Mesh Fabric",
      closureType: "Tali",
      outsole: "Phylon",
      origin: "Bandung, Indonesia",
      description: "Sneakers super ringan dengan bahan mesh breathable. Cocok untuk jogging ringan atau jalan santai. Sol Phylon yang empuk.",
      categoryIds: ["cat-sneakers"],
      imageUrl: "https://placehold.co/600x600/e94560/ffffff?text=Sport+Runner",
    },
    {
      id: "prod-005",
      name: "Fordza Suede Chelsea Boots",
      shortDescription: "Chelsea boots suede dengan elastic side panel.",
      price: 680000,
      productType: "shoes",
      gender: "Man",
      isPopular: true,
      isBestseller: false,
      isNew: true,
      avgRating: 4.6,
      totalReviews: 12,
      material: "Suede",
      closureType: "Slip-on",
      outsole: "Rubber",
      origin: "Garut, Indonesia",
      description: "Chelsea boots dari bahan suede premium. Elastic side panel untuk kemudahan pemakaian. Desain sleek cocok untuk casual-formal.",
      categoryIds: ["cat-boots"],
      imageUrl: "https://placehold.co/600x600/2b2d42/ffffff?text=Chelsea+Boots",
    },
    {
      id: "prod-006",
      name: "Fordza Penny Loafers",
      shortDescription: "Loafers klasik untuk tampilan smart casual.",
      price: 520000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: true,
      isNew: false,
      avgRating: 4.4,
      totalReviews: 18,
      material: "Genuine Cow Leather",
      closureType: "Slip-on",
      outsole: "Leather Sole",
      origin: "Garut, Indonesia",
      description: "Loafers kulit klasik dengan desain penny strap. Nyaman untuk dipakai seharian. Cocok untuk smart casual look.",
      categoryIds: ["cat-loafers", "cat-formal"],
      imageUrl: "https://placehold.co/600x600/8d99ae/ffffff?text=Penny+Loafers",
    },
    {
      id: "prod-007",
      name: "Fordza Canvas Slip-On",
      shortDescription: "Slip-on canvas yang simpel dan nyaman.",
      price: 200000,
      productType: "shoes",
      gender: "Unisex",
      isPopular: true,
      isBestseller: false,
      isNew: false,
      avgRating: 4.1,
      totalReviews: 35,
      material: "Canvas",
      closureType: "Slip-on",
      outsole: "Rubber",
      origin: "Bandung, Indonesia",
      description: "Slip-on canvas yang simpel dan nyaman untuk aktivitas sehari-hari. Ringan dan mudah dipakai. Tersedia untuk pria dan wanita.",
      categoryIds: ["cat-sneakers"],
      imageUrl: "https://placehold.co/600x600/457b9d/ffffff?text=Canvas+Slip-On",
    },
    {
      id: "prod-008",
      name: "Fordza Leather Sandals",
      shortDescription: "Sandal kulit premium untuk kenyamanan maksimal.",
      price: 380000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: false,
      isNew: true,
      avgRating: 4.3,
      totalReviews: 6,
      material: "Genuine Cow Leather",
      closureType: "Strap",
      outsole: "Rubber",
      origin: "Garut, Indonesia",
      description: "Sandal kulit asli dengan desain minimalis. Footbed empuk untuk kenyamanan seharian. Cocok untuk santai atau acara kasual.",
      categoryIds: ["cat-sandals"],
      imageUrl: "https://placehold.co/600x600/533483/ffffff?text=Leather+Sandals",
    },
    {
      id: "prod-009",
      name: "Fordza High-Top Sneakers",
      shortDescription: "Sneakers high-top dengan aksen kulit.",
      price: 450000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: false,
      isNew: true,
      avgRating: 4.0,
      totalReviews: 4,
      material: "Canvas",
      closureType: "Tali",
      outsole: "Rubber",
      origin: "Bandung, Indonesia",
      description: "High-top sneakers dengan kombinasi canvas dan aksen kulit sintetis. Desain street style yang keren. Sol karet anti-slip.",
      categoryIds: ["cat-sneakers"],
      imageUrl: "https://placehold.co/600x600/e07a5f/ffffff?text=High-Top",
    },
    {
      id: "prod-010",
      name: "Fordza Derby Shoes",
      shortDescription: "Derby shoes kulit polish untuk acara formal.",
      price: 580000,
      productType: "shoes",
      gender: "Man",
      isPopular: false,
      isBestseller: false,
      isNew: false,
      avgRating: 4.5,
      totalReviews: 10,
      material: "Genuine Cow Leather",
      closureType: "Tali",
      outsole: "Leather Sole",
      origin: "Garut, Indonesia",
      description: "Derby shoes dari kulit sapi polish. Open lacing system yang lebih fleksibel dari oxford. Cocok untuk formal dan semi-formal.",
      categoryIds: ["cat-formal"],
      imageUrl: "https://placehold.co/600x600/3d405b/ffffff?text=Derby+Shoes",
    },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { id: p.id } });
    if (existing) {
      console.log(`⏭️  ${p.name} sudah ada, skip.`);
      continue;
    }

    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        shortDescription: p.shortDescription,
        price: p.price,
        productType: p.productType,
        gender: p.gender,
        isPopular: p.isPopular,
        isBestseller: p.isBestseller,
        isNew: p.isNew,
        avgRating: p.avgRating,
        totalReviews: p.totalReviews,
        detail: {
          create: {
            description: p.description,
            material: p.material,
            closureType: p.closureType,
            outsole: p.outsole,
            origin: p.origin,
            sizeTemplateId: shoesTemplate.id,
          },
        },
        categories: {
          create: p.categoryIds.map((catId) => ({
            category: { connect: { id: catId } },
          })),
        },
        images: {
          create: [{ url: p.imageUrl, key: `dummy/${p.id}.jpg` }],
        },
      },
    });
    console.log(`✅ ${p.name} — ${p.material} — Rp ${p.price.toLocaleString()}`);
  }

  console.log("\n🌱 Seeding produk selesai!");
  console.log("📋 Ringkasan data untuk KNN:");
  console.log("   - 5 Kategori: Sneakers, Boots, Formal Shoes, Sandals, Loafers");
  console.log("   - 5 Material: Canvas, Genuine Cow Leather, Suede, Mesh Fabric");
  console.log("   - Rentang Harga: Rp 200.000 — Rp 750.000");
  console.log("   - 10 Produk dengan variasi atribut berbeda");
  console.log("\n🔗 Test KNN: http://localhost:3000/api/recommend/prod-001");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
