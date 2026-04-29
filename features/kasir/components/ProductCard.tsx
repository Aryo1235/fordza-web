"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRupiah } from "@/lib/utils";
import { type Product } from "../types";

interface ProductCardProps {
  product: Product;
  quantityInCart: (skuId?: string) => number;
  onAdd: (
    product: Product,
    variantId?: string,
    variantColor?: string,
    skuId?: string,
    skuSize?: string,
    price?: number,
    stock?: number,
    variantCode?: string,
    promoName?: string | null,
    additionalDiscount?: number,
    comparisonPrice?: number | null
  ) => void;
  onRemove: (productId: string, skuId?: string) => void;
  isJustAdded?: boolean;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAdd,
  onRemove,
  isJustAdded = false,
}: ProductCardProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const currentVariant = product.variants?.[selectedVariantIdx];
  
  // Jika tidak punya varian, pakai stok produk induk
  const displayStock = product.hasVariants 
    ? (currentVariant?.skus?.reduce((sum, s) => sum + s.stock, 0) || 0)
    : product.stock;

  const outOfStock = displayStock === 0;

  return (
    <div
      className={cn(
        "group bg-white rounded-lg md:rounded-xl border flex flex-col overflow-hidden transition-all duration-200",
        outOfStock ? "opacity-60" : "hover:shadow-lg hover:shadow-stone-200/40",
        isJustAdded && "ring-2 ring-amber-300 shadow-lg shadow-amber-100/70"
      )}
      style={{ borderColor: "#f3f0eb" }}
    >
      {/* Image Section */}
      <div className="relative aspect-[3/4] md:aspect-square bg-stone-50 overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-stone-200" />
          </div>
        )}

        <div className="absolute inset-0 p-1.5 md:p-2 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            {product.category && (
              <span className="bg-white/90 backdrop-blur-md text-[8px] md:text-[9px] font-semibold text-stone-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-wider shadow-sm">
                {product.category}
              </span>
            )}
          </div>

          {outOfStock && (
            <div className="self-center bg-black/60 backdrop-blur-md text-white text-[9px] md:text-[10px] font-semibold px-2 py-1 md:px-3 md:py-1.5 rounded-full uppercase">
              Stok Habis
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-2 md:p-3 flex flex-col flex-1 bg-white min-h-0">
        <div className="mb-2">
          <div className="flex justify-between items-start gap-1 mb-1">
            <p className="text-[9px] md:text-[10px] font-mono text-stone-400 uppercase tracking-wider truncate">
              {product.productCode || "NO-CODE"}
            </p>
            {product.hasVariants && currentVariant && (
               <p className="text-[9px] md:text-[10px] font-mono font-bold text-amber-600 uppercase bg-amber-50 px-1 rounded">
                {currentVariant.variantCode}
               </p>
            )}
          </div>
          
          <p className="text-[11px] md:text-sm font-semibold text-stone-800 leading-tight line-clamp-1 mb-1">
            {product.name}
          </p>
          
          <div className="flex flex-col gap-0.5 mt-1">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xs md:text-sm font-black text-stone-900 leading-none">
                {formatRupiah((currentVariant as any)?.finalPrice || currentVariant?.basePrice || product.price)}
              </p>
              {(currentVariant as any)?.finalPrice < (currentVariant?.basePrice || product.price) && (
                <span className="text-[9px] md:text-[10px] text-stone-400 line-through opacity-70">
                  {formatRupiah(currentVariant?.basePrice || product.price)}
                </span>
              )}
            </div>
            
            {/* Badge Transparan untuk Kasir */}
            <div className="flex flex-wrap gap-1 mt-0.5">
                {(currentVariant as any)?.finalPrice < (currentVariant?.basePrice || product.price) && (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100">
                        PROMO
                    </span>
                )}
                {(currentVariant as any)?.promoName && (
                    <span className="text-[8px] font-bold bg-amber-50 text-amber-600 px-1 py-0.5 rounded border border-amber-100 truncate max-w-[80px]">
                        🏷️ {(currentVariant as any).promoName}
                    </span>
                )}
            </div>
          </div>
        </div>
        
        {/* Variant/Size Picker Section */}
        <div className="mt-auto space-y-2">
          {product.hasVariants ? (
            <>
              {/* Variant Name Pickers (Ganti dari lingkaran ke Tulisan) */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-16 overflow-y-auto pr-1 custom-scrollbar">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantIdx(i)}
                    className={cn(
                      "px-3 py-1 text-[9px] font-black uppercase rounded-md border-2 transition-all duration-200",
                      selectedVariantIdx === i
                        ? "bg-[#3C3025] text-white border-[#3C3025] shadow-md scale-105"
                        : "bg-white text-stone-500 border-stone-100 hover:border-stone-300"
                    )}
                  >
                    {v.color}
                  </button>
                ))}
              </div>

              {/* SKU Selection Grid (Size) */}
              <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1 max-h-24 custom-scrollbar">
                {currentVariant.skus.map((sku) => {
                  const qty = quantityInCart(sku.id);
                  const isLow = sku.stock > 0 && sku.stock <= 3;
                  
                  // LOGIKA CERDAS: Ambil Harga Asli vs Harga Final
                  const originalPrice = sku.priceOverride ?? currentVariant.basePrice;
                  const finalPrice = (sku as any).finalPrice ?? originalPrice;
                  const calculatedDiscount = originalPrice - finalPrice;

                  return (
                    <button
                      key={sku.id}
                      disabled={sku.stock === 0}
                      onClick={() => onAdd(
                        product, 
                        currentVariant.id, 
                        currentVariant.color, 
                        sku.id, 
                        sku.size, 
                        originalPrice, // Pakai harga asli (250k) agar diskon terbaca
                        sku.stock, 
                        currentVariant.variantCode,
                        currentVariant.promoName,
                        calculatedDiscount, // Potongan yang benar (25k)
                        currentVariant.comparisonPrice 
                      )}
                      className={cn(
                        "relative min-w-[40px] flex flex-col items-center justify-center py-1.5 px-2 rounded border text-[10px] md:text-xs font-bold transition-all",
                        sku.stock === 0 
                          ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed" 
                          : qty > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-white text-stone-600 border-stone-200 hover:border-[#3C3025] hover:text-[#3C3025]"
                      )}
                    >
                      {sku.size}
                      <span className={cn(
                        "text-[7px] md:text-[8px] mt-0.5 font-normal",
                        isLow ? "text-red-500 font-bold" : "text-stone-400"
                      )}>
                        {sku.stock}
                      </span>
                      {qty > 0 && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] border border-white shadow-sm">
                          {qty}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Simple Product Button */
            <div className="pt-1">
              {quantityInCart() === 0 ? (
                <Button
                  onClick={() => onAdd(product)}
                  disabled={outOfStock}
                  className={cn(
                    "w-full h-8 md:h-9 rounded-md font-bold text-[10px] md:text-xs",
                    outOfStock ? "bg-stone-100 text-stone-400" : "bg-[#3C3025] hover:bg-[#4a3d30]"
                  )}
                >
                  Tambah Ke Keranjang
                </Button>
              ) : (
                <div className="flex items-center justify-between p-1 bg-stone-50 rounded-md border border-stone-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(product.id)}
                    className="w-7 h-7 md:w-8 md:h-8 hover:text-red-500"
                  >
                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <span className="text-xs md:text-sm font-bold text-[#3C3025]">
                    {quantityInCart()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAdd(product)}
                    disabled={quantityInCart() >= product.stock}
                    className="w-7 h-7 md:w-8 md:h-8 hover:text-amber-600"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
