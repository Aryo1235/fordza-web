export interface Testimonial {
  id: string;
  customerName: string;
  rating: number;
  content: string;
  isActive: boolean;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    name: string;
    images?: { url: string }[];
  };
}

export interface TestimonialFilters {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
}
