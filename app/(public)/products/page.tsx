import { Suspense } from "react";
import Link from "next/link";
import { ProductService } from "@/backend/services/products.service";
import { CategoryService } from "@/backend/services/category.service";
import { ProductCard } from "@/features/products/components/ProductCard";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductCatalogHeader } from "@/features/products/components/ProductCatalogHeader";
import { cn } from "@/lib/utils";
import { PublicPagination } from "@/components/shared/PublicPagination";
import { PackageSearch } from "lucide-react";

// Server Component (Next.js 15+ style)
export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;

  // 1. Persiapkan Filters
  const page = parseInt((searchParams.page as string) || "1");
  const limit = 12; // Sesuai grid 2(HP)/3(Tab)/4(Desktop)

  // Ambil multiple categoryIds jika ada
  const catParam = searchParams.categoryId;
  const categoryIds = Array.isArray(catParam)
    ? catParam
    : catParam ? [catParam] : undefined;

  const filters = {
    page,
    limit,
    search: (searchParams.search as string) || undefined,
    categoryIds,
    gender: (searchParams.gender as string) || undefined,
    isPopular: searchParams.isPopular === "true" || undefined,
    isBestseller: searchParams.isBestseller === "true" || undefined,
    isNew: searchParams.isNew === "true" || undefined,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice as string) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice as string) : undefined,
    sortBy: (searchParams.sortBy as string) || "latest",
  };

  // 2. Data Fetching (Paralel)
  const [productsData, categoriesData] = await Promise.all([
    ProductService.getAll(filters),
    CategoryService.getAll(1, 100), // Ambil semua kategori untuk filter
  ]);

  const products = productsData.products;
  const meta = productsData.meta;
  const categories = categoriesData.categories;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <main className="mx-auto max-w-7xl px-4 sm:px-6  py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filter - Desktop Sticky, Mobile Drawer via component */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 lg:self-start z-30">
            <Suspense fallback={<div className="h-96 w-full bg-zinc-100 animate-pulse rounded-xl" />}>
              <ProductFilters categories={categories} />
            </Suspense>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-h-[1000px]">
            {/* Header Dinamis */}
            <Suspense fallback={<div className="h-20 w-full bg-zinc-50 animate-pulse rounded-xl mb-10" />}>
              <ProductCatalogHeader categories={categories} />
            </Suspense>

            {/* Hasil Produk */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4  transition-all duration-500">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-[var(--fordza-cream)] p-6 rounded-full mb-4">
                  <PackageSearch className="size-12 text-[var(--fordza-brown)]/40" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Produk Tidak Ditemukan</h3>
                <p className="text-zinc-500 mt-2 max-w-xs">
                  Maaf, kami tidak menemukan produk yang sesuai dengan kriteria filter Anda.
                </p>
                <Link
                  href="/products"
                  className="mt-6 text-sm font-bold text-[var(--fordza-brown)] underline underline-offset-4"
                >
                  Lihat Semua Produk
                </Link>
              </div>
            )}

            {/* Paginasi Modern */}
            <PublicPagination
              currentPage={meta.currentPage}
              totalPage={meta.totalPage}
              useLinks={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}


