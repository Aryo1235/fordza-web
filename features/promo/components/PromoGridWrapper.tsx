// features/promo/components/PromoGridWrapper.tsx
// Server Component — fetch produk promo dan render grid + pagination
// Reuse ProductCard yang sama persis dengan halaman /products

import Link from "next/link";
import { ProductService } from "@/backend/services/products.service";
import { ProductCard } from "@/features/products/components/ProductCard";
import { PublicPagination } from "@/components/shared/PublicPagination";
import { BadgePercent } from "lucide-react";

interface PromoGridWrapperProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function PromoGridWrapper({ searchParams }: PromoGridWrapperProps) {
  const page = parseInt((searchParams.page as string) || "1");
  const limit = 12;
  const sortBy = (searchParams.sortBy as string) || "latest";
  const search = (searchParams.search as string) || undefined;

  const data = await ProductService.getAllPromo({ page, limit, sortBy, search });
  const products = data.products;
  const meta = data.meta;

  return (
    <>
      {products.length > 0 ? (
        <>
          {/* Info jumlah hasil */}
          <p className="text-xs text-zinc-400 font-medium mb-4">
            Menampilkan{" "}
            <span className="font-bold text-zinc-600">{meta.totalItems}</span>{" "}
            produk sedang promo
          </p>

          {/* Grid — identik dengan /products */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 transition-all duration-500">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        /* Empty state khusus promo */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-[var(--fordza-cream)] p-6 rounded-full mb-4">
            <BadgePercent className="size-12 text-[var(--fordza-brown)]/40" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Belum Ada Promo Aktif</h3>
          <p className="text-zinc-500 mt-2 max-w-xs">
            Saat ini tidak ada produk yang sedang dalam masa promosi.
            Pantau terus halaman ini untuk penawaran terbaik!
          </p>
          <Link
            href="/products"
            className="mt-6 text-sm font-bold text-[var(--fordza-brown)] underline underline-offset-4"
          >
            Lihat Semua Produk
          </Link>
        </div>
      )}

      {/* Pagination */}
      <PublicPagination
        currentPage={meta.currentPage}
        totalPage={meta.totalPage}
        useLinks={true}
        path="/promo"
      />
    </>
  );
}
