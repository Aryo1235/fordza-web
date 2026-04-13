export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  imageKey: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerFilters {
  page?: number;
  limit?: number;
}
