"use client";

import { usePopularProducts, useBestsellerProducts, useNewProducts } from "./hooks";
import { ProductSectionRow } from "./ProductSectionRow";
import Image from "next/image";
import { FadeUpSection } from "@/components/shared/animations";

export default function ProductsSection() {
  const popular = usePopularProducts();
  const bestseller = useBestsellerProducts();
  const newProds = useNewProducts();

  return (
    <section
      id="products"
      aria-label="Koleksi Produk Fordza"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-10 sm:gap-14"
    >
      <ProductSectionRow
        title="Populer"
        subtitle="Pilihan Favorit Pelanggan Kami"
        href="/products?isPopular=true"
        products={popular.data?.data ?? []}
        isLoading={popular.isLoading}
      />

      {/* ── Banner Promo dengan Parallax ── */}
      <FadeUpSection>
        <div className="relative w-full h-[200px] sm:h-[280px] md:h-[360px] rounded-2xl overflow-hidden shadow-md my-4 sm:my-6 group">

          {/* Gambar Background */}
          <Image
            src="/banner.jpg"
            alt="Banner Promo"
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 80vw"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />

          {/* Teks — fade up dengan delay */}
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 md:p-10 z-20">
            <FadeUpSection delay={0.15}>
              <h3
                className="text-white text-2xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-2 tracking-tight"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Koleksi Kulit Eksklusif
              </h3>
              <p
                className="text-[var(--fordza-cream)] text-xs sm:text-lg md:text-2xl lg:text-2xl xl:text-2xl max-w-[550px] leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Paduan sempurna antara material kulit premium dan keahlian tangan pengrajin lokal.
                Nikmati kenyamanan sejati dalam setiap langkah.
              </p>
            </FadeUpSection>
          </div>
        </div>
      </FadeUpSection>

      <ProductSectionRow
        title="Terlaris"
        subtitle="Produk dengan Penjualan Tertinggi"
        href="/products?isBestseller=true"
        products={bestseller.data?.data ?? []}
        isLoading={bestseller.isLoading}
      />

      <ProductSectionRow
        title="Terbaru"
        subtitle="Koleksi Terkini Fordza"
        href="/products?isNew=true"
        products={newProds.data?.data ?? []}
        isLoading={newProds.isLoading}
      />
    </section>
  );
}
