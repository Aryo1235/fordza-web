import { Suspense } from "react";
import { CategoryService } from "@/backend/services/category.service";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductCatalogHeader } from "@/features/products/components/ProductCatalogHeader";
import { ProductGridWrapper } from "@/features/products/components/ProductGridWrapper";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton";

// Server Component (Next.js 15+ style)
export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  // Hanya fetch categories di sini (ringan, jarang berubah)
  const categoriesData = await CategoryService.getAll(1, 100);
  const categories = categoriesData.categories;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-14">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Sidebar Filter */}
          <aside className="w-full lg:w-64.5 flex-shrink-0 lg:sticky lg:top-24 lg:self-start z-30">
            <Suspense fallback={<div className="h-96 w-full bg-zinc-100 animate-pulse rounded-xl" />}>
              <ProductFilters categories={categories} />
            </Suspense>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-h-[1000px]">
            {/* Header: judul, search, sort, badge filter — SELALU tampil, tidak ada skeleton */}
            <Suspense fallback={<div className="h-20 w-full bg-zinc-50 animate-pulse rounded-xl mb-10" />}>
              <ProductCatalogHeader categories={categories} />
            </Suspense>

            {/* Grid Produk — skeleton hanya di sini saat filter berubah */}
            <Suspense fallback={<ProductGridSkeleton />} key={JSON.stringify(searchParams)}>
              <ProductGridWrapper searchParams={searchParams} />
            </Suspense>
          </div>

        </div>
      </main>
    </div>
  );
}
