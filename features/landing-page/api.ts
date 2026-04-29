/**
 * features/landing-page/api.ts
 * Semua HTTP call untuk halaman publik / landing page.
 * Tidak ada kaitannya dengan admin panel.
 */

import api from "@/lib/api";
import type {
  PublicBannersResponse,
  PublicProductsResponse,
} from "./types";

/* ── Banner ── */

export async function fetchPublicBanners(): Promise<PublicBannersResponse> {
  const res = await api.get<PublicBannersResponse>("/api/public/banners", {
    params: { limit: 20 },
  });
  return res.data;
}

/* ── Products ── */

/** isPopular=true */
export async function fetchPopularProducts(): Promise<PublicProductsResponse> {
  const res = await api.get<PublicProductsResponse>("/api/public/products", {
    params: { isPopular: true, limit: 10, sortBy: "popular" },
  });
  return res.data;
}

/** isBestseller=true */
export async function fetchBestsellerProducts(): Promise<PublicProductsResponse> {
  const res = await api.get<PublicProductsResponse>("/api/public/products", {
    params: { isBestseller: true, limit: 10, sortBy: "latest" },
  });
  return res.data;
}

/** isNew=true */
export async function fetchNewProducts(): Promise<PublicProductsResponse> {
  const res = await api.get<PublicProductsResponse>("/api/public/products", {
    params: { isNew: true, limit: 10, sortBy: "latest" },
  });
  return res.data;
}
