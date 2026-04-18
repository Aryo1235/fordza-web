const { PrismaClient } = require("../app/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.skuStockLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sku: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  });

  const count = logs.length;
  console.log("Total logs in db:", count);

  logs.forEach((log, idx) => {
    console.log(`${idx + 1}. [${log.createdAt.toISOString()}] Product: ${log.sku.variant.product.name} | Variant: ${log.sku.variant.color} | Size: ${log.sku.size} | Type: ${log.type} | Stok: ${log.currentStock} `);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
