import { prisma } from '../lib/prisma';

async function main() {
  console.log("=== PROMO YANG AKTIF ===");
  const promos = await prisma.promo.findMany({
    where: { isActive: true }
  });
  console.dir(promos, { depth: null });

  console.log("\n=== TRANSAKSI TERAKHIR ===");
  const lastTx = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      items: true
    }
  });
  console.dir(lastTx, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
