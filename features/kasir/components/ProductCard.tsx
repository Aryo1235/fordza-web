"use client";

import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  productCode: string | null;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
}

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAdd: () => void;
  onRemove: () => void;
  isJustAdded?: boolean;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAdd,
  onRemove,
  isJustAdded = false,
}: ProductCardProps) {
  const outOfStock = product.stock === 0;
  const maxReached = quantityInCart >= product.stock;

  return (
    <div
      className={cn(
        "group bg-white rounded-lg md:rounded-xl border flex flex-col overflow-hidden transition-all duration-200",
        outOfStock ? "opacity-60" : "hover:shadow-lg hover:shadow-stone-200/40",
        isJustAdded && "ring-2 ring-amber-300 shadow-lg shadow-amber-100/70"
      )}
      style={{ borderColor: "#f3f0eb" }}
    >
      {/* Image Section - portrait on mobile, square on tablet */}
      <div className="relative aspect-[3/4] md:aspect-square bg-stone-50 overflow-hidden">
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

        {/* Overlay Badges */}
        <div className="absolute inset-0 p-1.5 md:p-2 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            {product.category && (
              <span className="bg-white/90 backdrop-blur-md text-[8px] md:text-[9px] font-semibold text-stone-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md uppercase tracking-wider shadow-sm">
                {product.category}
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && !outOfStock && (
              <span className="bg-amber-500 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 md:px-2 md:py-1 rounded-md font-semibold shadow-sm">
                LIMIT
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
      <div className="p-2 md:p-3 flex flex-col flex-1 bg-white">
        <div className="mb-1.5 md:mb-2.5">
          {product.productCode && (
            <p className="text-[9px] md:text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-0.5 truncate">
              {product.productCode}
            </p>
          )}
          <p className="text-[11px] md:text-sm font-semibold text-stone-800 leading-tight line-clamp-2 min-h-8 md:min-h-10 transition-colors">
            {product.name}
          </p>
          <div className="flex items-baseline gap-0.5 mt-1">
            <span className="text-[9px] md:text-[10px] font-semibold text-stone-400">Rp</span>
            <span className="text-xs md:text-base font-bold text-[#3C3025]">
              {product.price.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="mt-auto">
          {quantityInCart === 0 ? (
            <Button
              onClick={onAdd}
              disabled={outOfStock}
              className={cn(
                "w-full h-8 md:h-10 rounded-md md:rounded-lg font-semibold text-[11px] md:text-xs transition-all duration-200",
                outOfStock
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-[#3C3025] hover:bg-[#4a3d30] text-white"
              )}
            >
              Tambah
            </Button>
          ) : (
            <div className="flex items-center justify-between p-0.5 md:p-1 bg-stone-50 rounded-md md:rounded-lg border border-stone-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="w-7 h-7 md:w-9 md:h-9 rounded-md text-stone-500 hover:bg-white hover:text-red-500"
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              <span className="text-xs md:text-sm font-bold text-[#3C3025]">
                {quantityInCart}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAdd}
                disabled={maxReached}
                className="w-7 h-7 md:w-9 md:h-9 rounded-md text-stone-500 hover:bg-white hover:text-amber-600"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
