// Load env variables
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      productType: true,
    }
  });
  console.log("Database Products:");
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
