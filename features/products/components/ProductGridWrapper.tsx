import Link from "next/link";
import { ProductService } from "@/backend/services/products.service";
import { ProductCard } from "@/features/products/components/ProductCard";
import { PublicPagination } from "@/components/shared/PublicPagination";
import { PackageSearch } from "lucide-react";

interface ProductGridWrapperProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function ProductGridWrapper({ searchParams }: ProductGridWrapperProps) {
  const page = parseInt((searchParams.page as string) || "1");
  const limit = 12;

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

  const productsData = await ProductService.getAll(filters);
  const products = productsData.products;
  const meta = productsData.meta;

  return (
    <>
      {/* Grid Produk */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 transition-all duration-500">
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

      {/* Paginasi */}
      <PublicPagination
        currentPage={meta.currentPage}
        totalPage={meta.totalPage}
        useLinks={true}
      />
    </>
  );
}
