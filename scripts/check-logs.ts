import { prisma } from "../lib/prisma";

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
    console.log(`${idx + 1}. [${log.createdAt.toISOString()}] Product: ${log.sku?.variant?.product?.name || 'N/A'} | Variant: ${log.sku?.variant?.color || 'N/A'} | Size: ${log.sku?.size || 'N/A'} | Type: ${log.type} | Stok: ${log.currentStock} `);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
