import { prisma } from "@/lib/prisma";

export const SizeTemplateService = {
  async getAll() {
    return await prisma.sizeTemplate.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(data: any) {
    return await prisma.sizeTemplate.create({ data });
  },
};
