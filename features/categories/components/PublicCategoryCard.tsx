import Link from "next/link";
import { Category } from "../types";

export function PublicCategoryCard({ category }: { category: Category }) {
  // Use image URL from DB or a fallback placeholder if null
  const imageUrl = category.imageUrl || "/placeholder.jpg";

  return (
    <Link 
      href={`/products?categoryId=${category.id}`}
      className="group relative block overflow-hidden rounded-xl bg-zinc-100 aspect-[4/3]"
    >
      {/* Background Image - Standard img with lazy loading */}
      <img
        src={imageUrl}
        alt={category.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
      
      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Content Positioned at Bottom Left */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          {category.name}
        </h3>
        
        {category.shortDescription && (
          <p className="text-sm text-zinc-200 line-clamp-4">
            {category.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
}
