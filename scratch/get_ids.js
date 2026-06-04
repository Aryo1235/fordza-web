const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findFirst({ select: { id: true, name: true }});
  const template = await prisma.sizeTemplate.findFirst({ select: { id: true, name: true }});
  console.log('Valid Category:', category);
  console.log('Valid Template:', template);
}

main().finally(() => prisma.$disconnect());
