// features/categories/types.ts

export interface Category {
  id: string;
  name: string;
  shortDescription?: string | null;
  imageUrl: string;
  imageKey?: string | null;
  isActive: boolean;
  order: number;
}
