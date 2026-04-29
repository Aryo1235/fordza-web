/**
 * features/landing-page/hooks.ts
 * React Query hooks untuk kebutuhan halaman publik / landing page.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicBanners,
  fetchPopularProducts,
  fetchBestsellerProducts,
  fetchNewProducts,
} from "./api";

export const landingPageKeys = {
  banners: ["landing-page", "banners"] as const,
  popularProducts: ["landing-page", "products", "popular"] as const,
  bestsellerProducts: ["landing-page", "products", "bestseller"] as const,
  newProducts: ["landing-page", "products", "new"] as const,
};

export function usePublicBanners() {
  return useQuery({
    queryKey: landingPageKeys.banners,
    queryFn: fetchPublicBanners,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopularProducts() {
  return useQuery({
    queryKey: landingPageKeys.popularProducts,
    queryFn: fetchPopularProducts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBestsellerProducts() {
  return useQuery({
    queryKey: landingPageKeys.bestsellerProducts,
    queryFn: fetchBestsellerProducts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNewProducts() {
  return useQuery({
    queryKey: landingPageKeys.newProducts,
    queryFn: fetchNewProducts,
    staleTime: 1000 * 60 * 5,
  });
}
