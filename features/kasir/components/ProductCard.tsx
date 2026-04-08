"use client";

import { Plus, Minus, ShoppingBag } from "lucide-react";

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
      className={`bg-white rounded border flex flex-col overflow-hidden transition-all ${
        outOfStock ? "opacity-50" : "hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={{ borderColor: "#e5e0d8" }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-stone-300" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-sm">
              HABIS
            </span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && !outOfStock && (
          <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-sm font-medium">
            Sisa {product.stock}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        {product.category && (
          <p className="text-xs text-stone-400 uppercase tracking-wider truncate">
            {product.category}
          </p>
        )}
        <p className="text-sm font-semibold text-stone-800 leading-tight line-clamp-2">
          {product.name}
        </p>
        <p className="text-sm font-bold" style={{ color: "#3C3025" }}>
          Rp {product.price.toLocaleString("id-ID")}
        </p>

        {/* Cart Controls */}
        <div className="mt-auto pt-1.5">
          {quantityInCart === 0 ? (
            <button
              onClick={onAdd}
              disabled={outOfStock}
              className="w-full py-1.5 text-xs font-semibold text-white rounded-sm transition-colors disabled:cursor-not-allowed"
              style={{ backgroundColor: outOfStock ? "#ccc" : "#3C3025" }}
            >
              + Tambah
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onRemove}
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-stone-300 hover:bg-stone-100 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold" style={{ color: "#3C3025" }}>
                {quantityInCart}
              </span>
              <button
                onClick={onAdd}
                disabled={maxReached}
                className="w-8 h-8 flex items-center justify-center rounded-sm text-white transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#3C3025" }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
