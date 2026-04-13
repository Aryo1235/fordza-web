"use client";

import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
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
}

export default function ProductCard({
  product,
  quantityInCart,
  onAdd,
  onRemove,
}: ProductCardProps) {
  const outOfStock = product.stock === 0;
  const maxReached = quantityInCart >= product.stock;

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl border flex flex-col overflow-hidden transition-all duration-300",
        outOfStock ? "opacity-60" : "hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1"
      )}
      style={{ borderColor: "#f3f0eb" }}
    >
      {/* Image Section */}
      <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-stone-200" />
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            {product.category && (
              <span className="bg-white/80 backdrop-blur-md text-[9px] font-bold text-stone-600 px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                {product.category}
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && !outOfStock && (
              <span className="bg-amber-500 text-white text-[9px] px-2 py-1 rounded-lg font-black shadow-sm animate-pulse">
                STOK LIMIT
              </span>
            )}
          </div>
          
          {outOfStock && (
            <div className="self-center bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase">
              Habis Terjual
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-4 flex flex-col flex-1 bg-white">
        <div className="mb-3">
          <p className="text-xs md:text-sm font-bold text-stone-800 leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-amber-700 transition-colors">
            {product.name}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[10px] font-bold text-stone-400">Rp</span>
            <span className="text-sm md:text-base font-black text-[#3C3025]">
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
                "w-full h-10 rounded-xl font-bold text-xs transition-all duration-300",
                outOfStock 
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                  : "bg-[#3C3025] hover:bg-[#4a3d30] text-white active:scale-95 shadow-md shadow-stone-200"
              )}
            >
              Tambah ke Keranjang
            </Button>
          ) : (
            <div className="flex items-center justify-between p-1 bg-stone-50 rounded-xl border border-stone-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="w-8 h-8 rounded-lg text-stone-500 hover:bg-white hover:text-red-500 hover:shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-sm font-black text-[#3C3025]">
                {quantityInCart}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAdd}
                disabled={maxReached}
                className="w-8 h-8 rounded-lg text-stone-500 hover:bg-white hover:text-amber-600 hover:shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
