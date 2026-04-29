"use client";

import { Heart, Package } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Product } from "@/features/products/types";

/* ── helpers ── */
function formatRupiah(val: number | string | null | undefined) {
  if (val == null) return "–";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(Number(val))
    .replace("IDR", "Rp.");
}

/* ── Badge pill / rect ── */
function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: "brown" | "red" | "blue";
}) {
  const styles = {
    brown: "bg-[#4A3B2E] text-white", // fordza-brown
    red: "bg-[#C14444] text-white", // soft red
    blue: "bg-[#2267A2] text-white", // corporate blue
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] px-2 py-1.5 text-[10px] font-medium leading-none whitespace-nowrap",
        styles[color]
      )}
    >
      {label}
    </span>
  );
}

/* ── Main Card ── */
export function ProductCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const image = product.images?.[0]?.url;

  // Mencari harga varian paling murah secara dinamis
  let displayFinalPrice = Number(product.finalPrice ?? product.price ?? 0);
  let displayHighestPrice = Number(product.highestPrice ?? product.price ?? 0);
  let displayDiscount = Math.round(Number(product.totalDiscountPercent ?? 0));

  if (product.variants && product.variants.length > 0) {
    let minPrice = Infinity;
    let targetVariant = product.variants[0];

    for (const v of product.variants) {
      if (!v.isActive) continue;
      const vPrice = Number(v.finalPrice ?? v.basePrice ?? Infinity);

      if (vPrice < minPrice) {
        minPrice = vPrice;
        targetVariant = v;
      }

      if (v.skus) {
        for (const s of v.skus) {
          if (!s.isActive) continue;
          const sPrice = Number(s.finalPrice ?? s.priceOverride ?? vPrice);
          if (sPrice < minPrice) {
            minPrice = sPrice;
            targetVariant = v;
          }
        }
      }
    }

    if (minPrice !== Infinity) {
      displayFinalPrice = minPrice;
      displayHighestPrice = Number(targetVariant.highestPrice ?? targetVariant.comparisonPrice ?? targetVariant.basePrice ?? minPrice);
      displayDiscount = Math.round(Number(targetVariant.totalDiscountPercent ?? targetVariant.discountPercent ?? 0));
    }
  }

  const hasDiscount = Boolean(displayDiscount > 0);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative h-full flex flex-col p-2.5 rounded-2xl overflow-hidden bg-[var(--fordza-cream)] border border-[var(--fordza-cream-dark)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* ── Ornamen Segitiga Khas Fordza (Di atas Cream, Di luar kotak putih) ── */}
      <div
        className="absolute top-0 left-0 w-[14.5rem] h-[13rem] md:w-[16rem] md:h-[14.5rem] lg:w-[20rem] lg:h-[18rem] xl:w-[18rem] xl:h-[17rem] bg-[#4A3B2E] z-0"
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />


      {/* ── Area Gambar Putih ── */}
      <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-sm z-10"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Gambar Sepatu - MENGGUNAKAN IMG STANDAR UNTUK MENGHINDARI LIMIT VERCEL */}
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-12 text-[var(--fordza-cream-dark)]" />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-2 p-1 pb-3 pt-3 z-10">

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
          {(product.isPopular || product.isBestseller || product.isNew) && (
            <>
              {product.isPopular && <StatusBadge label="Populer" color="brown" />}
              {product.isBestseller && <StatusBadge label="Terlaris" color="red" />}
              {product.isNew && <StatusBadge label="Terbaru" color="blue" />}
            </>
          )}
        </div>

        {/* Nama produk */}
        <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[40px]" style={{ fontFamily: "Inter, sans-serif" }}>
          {product.name}
        </p>

        {/* Deskripsi */}
        <div className="min-h-[36px]">
          {product.shortDescription ? (
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed line-clamp-2">
              {product.shortDescription}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-transparent">
          {/* Harga */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] tracking-wide text-gray-400 font-medium">
                Harga
              </span>
              {hasDiscount && displayHighestPrice !== displayFinalPrice ? (
                <span className="text-[9px] font-medium text-gray-400 line-through">
                  {formatRupiah(displayHighestPrice)}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900 leading-none">
                {formatRupiah(displayFinalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">
                  -{displayDiscount}%
                </span>
              )}
            </div>
          </div>

          {/* Wishlist button */}
          <button
            aria-label="Tambah ke wishlist"
            onClick={(e) => {
              e.preventDefault();
              setWished((w) => !w);
            }}
            className={cn(
              "flex size-7 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors duration-200",
              wished
                ? "bg-rose-500 border-rose-500 text-white"
                : "bg-transparent border-gray-400 text-gray-400 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-500"
            )}
          >
            <Heart className={cn("size-3.5", wished && "fill-white text-rose-500")} />
          </button>
        </div>
      </div>
    </Link>
  );
}
