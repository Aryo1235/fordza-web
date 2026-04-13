import { ProductRepository } from "@/backend/repositories/products.repo";

export const ProductService = {
  async getAll(filters: any) {
    // Validasi atau logika bisnis bisa diletakkan di sini nantinya
    return await ProductRepository.getAll(filters);
  },

  async create(data: any) {
    // Harga minimum dsb. bisa dicek di sini
    return await ProductRepository.create(data);
  },

  async getById(id: string) {
    return await ProductRepository.getById(id);
  },

  async getRelated(productId: string, limit: number = 4) {
    return await ProductRepository.getRelated(productId, limit);
  },

  async getAllAdmin(filters: any) {
    return await ProductRepository.getAllAdmin(filters);
  },

  async getAllAdminExport(filters: any) {
    return await ProductRepository.getAllAdminExport(filters);
  },

  async update(id: string, data: any, operatorId?: string) {
    return await ProductRepository.update(id, data, operatorId);
  },

  async delete(id: string) {
    // Bisa tambahkan validasi "Apakah produk ada di transaksi aktif?"
    return await ProductRepository.delete(id);
  },

  async bulkUpdateStock(
    items: { id: string; stock: number }[],
    operatorId?: string,
  ) {
    return await ProductRepository.bulkUpdateStock(items, operatorId);
  },
};
