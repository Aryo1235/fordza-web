import { TransactionRepository } from "../repositories/transaction.repo";
import { format } from "date-fns";

type SalesReportFilters = {
  search?: string;
  sortBy?: "quantity" | "revenue" | "name";
  minQuantity?: number;
};

type SalesReportPagination = {
  page?: number;
  limit?: number;
};

function buildChartData(dailySales: any[]) {
  const dailyMap: Record<string, number> = {};

  dailySales.forEach((tx) => {
    const dateKey = format(new Date(tx.createdAt), "yyyy-MM-dd");
    dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Number(tx.totalPrice);
  });

  return Object.entries(dailyMap)
    .map(([date, revenue]) => ({
      date,
      revenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getFilteredSoldProducts(
  soldProducts: any[],
  filters: SalesReportFilters,
) {
  const search = filters.search?.trim().toLowerCase() || "";
  const minQuantity = Number.isFinite(filters.minQuantity)
    ? Number(filters.minQuantity)
    : undefined;

  return [...soldProducts]
    .filter((product: any) => {
      const matchesSearch =
        !search ||
        String(product.name || "")
          .toLowerCase()
          .includes(search) ||
        String(product.code || "")
          .toLowerCase()
          .includes(search);

      const matchesQuantity =
        minQuantity === undefined ||
        Number(product.quantity || 0) >= minQuantity;

      return matchesSearch && matchesQuantity;
    })
    .sort((a: any, b: any) => {
      switch (filters.sortBy) {
        case "name":
          return String(a.name || "").localeCompare(String(b.name || ""));
        case "revenue":
          return Number(b.revenue || 0) - Number(a.revenue || 0);
        case "quantity":
        default:
          return Number(b.quantity || 0) - Number(a.quantity || 0);
      }
    });
}

function getPagination(page?: number, limit?: number) {
  const safeLimit = Math.max(1, Number(limit || 10));
  const safePage = Math.max(1, Number(page || 1));
  const offset = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, offset };
}

async function getBaseReport(dateFrom: string, dateTo: string) {
  const rawData = await TransactionRepository.getReportStats(dateFrom, dateTo);

  return {
    rawData,
    chartData: buildChartData(rawData.dailySales),
  };
}

export const ReportService = {
  async getSalesReportSummary(dateFrom: string, dateTo: string) {
    const { rawData, chartData } = await getBaseReport(dateFrom, dateTo);
    const soldProducts = getFilteredSoldProducts(rawData.soldProducts, {});

    return {
      summary: {
        totalRevenue: rawData.revenue,
        totalOrders: rawData.orderCount,
        averageOrderValue:
          rawData.orderCount > 0 ? rawData.revenue / rawData.orderCount : 0,
      },
      chartData,
      topProducts: soldProducts.slice(0, 5),
    };
  },

  async getSalesReportItems(
    dateFrom: string,
    dateTo: string,
    filters: SalesReportFilters = {},
    pagination: SalesReportPagination = {},
  ) {
    const { rawData } = await getBaseReport(dateFrom, dateTo);
    const soldProducts = getFilteredSoldProducts(rawData.soldProducts, filters);
    const { page, limit, offset } = getPagination(
      pagination.page,
      pagination.limit,
    );
    const paginatedSoldProducts = soldProducts.slice(offset, offset + limit);

    return {
      soldProducts: paginatedSoldProducts,
      pagination: {
        page,
        limit,
        totalItems: soldProducts.length,
        totalPages: Math.max(1, Math.ceil(soldProducts.length / limit)),
      },
    };
  },

  async getSalesReportStats(
    dateFrom: string,
    dateTo: string,
    filters: SalesReportFilters = {},
  ) {
    const { rawData, chartData } = await getBaseReport(dateFrom, dateTo);
    const soldProducts = getFilteredSoldProducts(rawData.soldProducts, filters);

    return {
      summary: {
        totalRevenue: rawData.revenue,
        totalOrders: rawData.orderCount,
        averageOrderValue:
          rawData.orderCount > 0 ? rawData.revenue / rawData.orderCount : 0,
      },
      chartData,
      soldProducts,
    };
  },
};
