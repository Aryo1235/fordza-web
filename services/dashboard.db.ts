import { prisma } from "@/lib/prisma";

export const DashboardService = {
  async getStats() {
    const [totalProducts, totalCategories, totalBanners, totalTestimonials, categoryStats] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.banner.count({ where: { isActive: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          name: true,
          _count: { select: { products: true } }
        }
      })
    ]);

    const chartData = categoryStats.map(c => ({
      name: c.name,
      total: c._count.products
    }));

    return {
      totalProducts,
      totalCategories,
      totalBanners,
      totalTestimonials,
      chartData
    };
  }
};
