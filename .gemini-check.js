const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const skus = await prisma.productSku.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { variant: { include: { product: true } } }
  });
  console.log(JSON.stringify(skus, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
