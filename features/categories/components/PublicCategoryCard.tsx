import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Category } from "../types";

export function PublicCategoryCard({ category }: { category: Category }) {
  // Use image URL from DB or a fallback placeholder if null
  const imageUrl = category.imageUrl || "/placeholder.jpg";
  const productCount = category._count?.products ?? 0;

  return (
    <Link 
      href={`/products?categoryId=${category.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full"
    >
      {/* Top Image Section (Fully Visible, Not Covered by Text) */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-50 relative border-b border-stone-100">
        <img
          src={imageUrl}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Product Count Badge */}
        {productCount > 0 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-0.5 bg-stone-900/85 backdrop-blur-xs rounded-full text-white text-[9px] font-black uppercase tracking-wider">
            <ShoppingBag className="w-3 h-3 text-amber-400" />
            <span>{productCount} Produk</span>
          </div>
        )}
      </div>
      
      {/* Bottom Text Details Section */}
      <div className="p-4 flex flex-col justify-between flex-1 bg-white">
        <div>
          <h3 className="text-xs md:text-sm font-black text-stone-800 tracking-wide uppercase group-hover:text-amber-700 transition-colors">
            {category.name}
          </h3>
          
          {category.shortDescription && (
            <p className="text-[10px] md:text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {category.shortDescription}
            </p>
          )}
        </div>

        {/* Action Link Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 text-[10px] md:text-[11px] font-bold text-stone-400 group-hover:text-stone-700 transition-colors">
          <span>Lihat Koleksi</span>
          <div className="w-6 h-6 rounded-full bg-stone-50 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center transition-all duration-300">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
