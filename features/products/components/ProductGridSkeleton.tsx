export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-[var(--fordza-cream)] border border-[var(--fordza-cream-dark)]"
        >
          {/* Gambar placeholder */}
          <div
            className="w-full bg-zinc-200 animate-pulse"
            style={{ aspectRatio: "1/1", animationDelay: `${i * 30}ms` }}
          />
          {/* Body placeholder */}
          <div className="p-3 flex flex-col gap-2 pb-5 pt-4">
            <div className="h-3.5 w-3/4 bg-zinc-200 animate-pulse rounded-md" style={{ animationDelay: `${i * 30}ms` }} />
            <div className="h-3 w-1/2 bg-zinc-200 animate-pulse rounded-md" style={{ animationDelay: `${i * 30 + 50}ms` }} />
            <div className="mt-3 pt-3 border-t border-zinc-100 flex justify-between items-end">
              <div className="flex flex-col gap-1.5">
                <div className="h-2.5 w-10 bg-zinc-200 animate-pulse rounded" style={{ animationDelay: `${i * 30 + 80}ms` }} />
                <div className="h-4 w-24 bg-zinc-200 animate-pulse rounded" style={{ animationDelay: `${i * 30 + 100}ms` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
