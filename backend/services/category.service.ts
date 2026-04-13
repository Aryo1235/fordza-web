import { CategoryRepository } from "@/backend/repositories/category.repo";

export const CategoryService = {
  async getAll(page: number = 1, limit: number = 20) {
    return await CategoryRepository.getAll(page, limit);
  },

  async create(data: any) {
    return await CategoryRepository.create(data);
  },

  async getById(id: string) {
    return await CategoryRepository.getById(id);
  },

  async getAllAdmin(page: number = 1, limit: number = 20) {
    return await CategoryRepository.getAllAdmin(page, limit);
  },

  async update(id: string, data: any) {
    return await CategoryRepository.update(id, data);
  },

  async delete(id: string) {
    return await CategoryRepository.delete(id);
  },
};
