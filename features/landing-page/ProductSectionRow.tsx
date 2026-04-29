import Link from "next/link";
import type { Product } from "@/features/products/types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";

interface ProductSectionRowProps {
  title: string;
  subtitle: string;
  /** URL untuk tombol "Lihat semua" */
  href: string;
  products: Product[];
  isLoading: boolean;
  /** Berapa card yang ditampilkan (default 5) */
  limit?: number;
}

export function ProductSectionRow({
  title,
  subtitle,
  href,
  products,
  isLoading,
  limit = 6,
}: ProductSectionRowProps) {
  const skeletons = Array.from({ length: limit });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-lg sm:text-xl font-black text-[var(--fordza-brown)]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {title}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {subtitle}
          </p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--fordza-brown)] hover:text-[var(--fordza-brown-light)] transition-colors duration-150 mt-1 whitespace-nowrap"
        >
          Lihat semua <span aria-hidden>›</span>
        </Link>
      </div>

      {/* ── Carousel Produk (Horizontal Scroll) ── */}
      {/* Menggunakan flex + overflow-x-auto dengan scrollbar tipis (custom-scrollbar).
          Lebar card diatur responsif agar sebagian card berikutnya (peek) mengintip di pinggir layar. */}
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-5 pb-4 custom-scrollbar"
        style={{ scrollPaddingLeft: "0px" }}
      >
        {isLoading
          ? skeletons.map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[31%] lg:w-[31%] xl:w-[23.5%]">
                <ProductCardSkeleton />
              </div>
            ))
          : products.slice(0, limit).map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[65%] sm:w-[45%] md:w-[31%] lg:w-[31%] xl:w-[23.5%]">
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </div>
  );
}
