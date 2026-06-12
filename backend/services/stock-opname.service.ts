import { StockOpnameRepository } from "@/backend/repositories/stock-opname.repo";

export const StockOpnameService = {
  async getForOpname(filters: { search?: string; page?: number; limit?: number }) {
    return await StockOpnameRepository.getForOpname(filters);
  },

  async getForOpnameExport(filters: { search?: string }) {
    return await StockOpnameRepository.getForOpnameExport(filters);
  },

  async bulkUpdateStock(
    items: { id: string; stock: number }[],
    operatorId?: string,
  ) {
    return await StockOpnameRepository.bulkUpdateStock(items, operatorId);
  },
};
