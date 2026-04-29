import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full p-2.5 rounded-2xl border border-[var(--fordza-cream-dark)] bg-[var(--fordza-cream)] overflow-hidden relative">
      {/* ── Ornamen Segitiga Khas Fordza (Matching ProductCard) ── */}
      <div 
        className="absolute top-0 left-0 w-[14.5rem] h-[13rem] md:w-[16rem] md:h-[14.5rem] lg:w-[20rem] lg:h-[18rem] xl:w-[20rem] xl:h-[18rem] bg-[var(--fordza-cream-dark)] z-0 opacity-40" 
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} 
      />

      {/* Gambar area */}
      <div className="relative w-full bg-white rounded-xl overflow-hidden z-10 shadow-sm" style={{ aspectRatio: "1 / 1" }}>
        <Skeleton className="w-full h-full bg-gray-100" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-1 pb-3 pt-3 z-10">
        <Skeleton className="h-4 w-3/4 rounded bg-gray-200" />
        
        <div className="space-y-1.5 mt-1">
          <Skeleton className="h-2.5 w-full rounded bg-gray-100" />
          <Skeleton className="h-2.5 w-5/6 rounded bg-gray-100" />
        </div>
        
        {/* Footer */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col gap-1 w-1/2">
            <Skeleton className="h-2 w-8 rounded bg-gray-100" />
            <Skeleton className="h-4 w-full rounded bg-gray-200" />
          </div>
          <Skeleton className="size-7 rounded-[4px] bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
