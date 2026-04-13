import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Mulai seeding...");

  // --- Seed Admin & Kasir ---
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  const hashedPassword = await bcrypt.hash("fordza2026", 12);

  if (!existingAdmin) {
    const admin = await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "Admin Fordza",
        role: "ADMIN",
        pin: "123456",
      },
    });
    console.log("✅ Admin dibuat:", admin.username);
  } else {
    console.log("⏭️  Admin sudah ada, skip.");
  }

  const existingKasir = await prisma.admin.findUnique({
    where: { username: "kasir" },
  });

  if (!existingKasir) {
    const kasir = await prisma.admin.create({
      data: {
        username: "kasir",
        password: hashedPassword,
        name: "Kasir Toko",
        role: "KASIR",
        pin: "223344",
      },
    });
    console.log("✅ Kasir dibuat:", kasir.username);
  } else {
    console.log("⏭️  Kasir sudah ada, skip.");
  }

  // --- Seed Size Templates ---
  const existingTemplates = await prisma.sizeTemplate.count();

  if (existingTemplates === 0) {
    await prisma.sizeTemplate.createMany({
      data: [
        {
          name: "Sepatu EU",
          type: "shoes",
          sizes: ["38", "39", "40", "41", "42", "43", "44"],
        },
        {
          name: "Apparel Shirt",
          type: "apparel",
          sizes: ["S", "M", "L", "XL", "XXL"],
        },
        {
          name: "Free Size",
          type: "accessories",
          sizes: ["Free Size"],
        },
      ],
    });
    console.log("✅ Size Templates dibuat (3 template)");
  } else {
    console.log("⏭️  Size Templates sudah ada, skip.");
  }

  // --- Seed Products ---
  const existingProducts = await prisma.product.count();

  if (existingProducts === 0) {
    // 1. Create Categories first
    const catSepatu = await prisma.category.create({
      data: {
        name: "Sepatu Kulit",
        shortDescription: "Koleksi sepatu kulit premium",
        imageUrl: "https://placehold.co/400x400/png?text=Sepatu+Kulit",
        imageKey: "seed/sepatu.png",
        order: 1,
      },
    });

    const catSandals = await prisma.category.create({
      data: {
        name: "Sandal",
        shortDescription: "Sandal santai yang elegan",
        imageUrl: "https://placehold.co/400x400/png?text=Sandal",
        imageKey: "seed/sandal.png",
        order: 2,
      },
    });
    console.log("✅ Categories dibuat (2 kategori)");

    // 2. Need generic size template to link
    const sampleSz = await prisma.sizeTemplate.findFirst({ where: { type: "shoes" } });

    // 3. Create Products
    const p1 = await prisma.product.create({
      data: {
        productCode: "FDZ-SHOE-001",
        name: "Fordza Sepatu Oxford Klasik",
        shortDescription: "Sepatu formal untuk ke kantor",
        price: 350000,
        stock: 50,
        productType: "shoes",
        gender: "Man",
        isPopular: true,
        isBestseller: true,
        isNew: false,
        isActive: true,
        detail: {
          create: {
            description: "Sepatu klasik berdesain elegan. Terbuat dari kulit asli pilihan dengan jahitan kokoh.",
            material: "Kulit Sapi Asli",
            closureType: "Laces",
            outsole: "Rubber Anti-Slip",
            origin: "Bandung, Indonesia",
            sizeTemplateId: sampleSz?.id,
          },
        },
        categories: {
          create: [{ categoryId: catSepatu.id }]
        },
        images: {
          create: [
            { url: "https://placehold.co/600x600/png?text=Oxford+Klasik", key: "seed/oxford1.png" }
          ]
        }
      }
    });

    const p2 = await prisma.product.create({
      data: {
        productCode: "FDZ-SNDL-001",
        name: "Fordza Sandal Casual Pria",
        shortDescription: "Sandal kulit nyaman sehari-hari",
        price: 210000,
        stock: 100,
        productType: "shoes",
        gender: "Man",
        isPopular: false,
        isBestseller: false,
        isNew: true,
        isActive: true,
        detail: {
          create: {
            description: "Sandal pria cocok untuk akhir pekan dengan insole empuk.",
            material: "Kulit Sintetis Premium",
            closureType: "Slip-on",
            outsole: "TPR Ringan",
            origin: "Bandung, Indonesia",
            sizeTemplateId: sampleSz?.id,
          },
        },
        categories: {
          create: [{ categoryId: catSandals.id }]
        },
        images: {
          create: [
            { url: "https://placehold.co/600x600/png?text=Sandal+Pria", key: "seed/sandal1.png" }
          ]
        }
      }
    });

    console.log("✅ Products dibuat (2 produk beserta stok)");
  } else {
    console.log("⏭️  Products sudah ada, skip.");
  }

  console.log("🌱 Seeding selesai!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
