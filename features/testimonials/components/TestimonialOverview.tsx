"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { TestimonialStats } from "../types";

interface TestimonialOverviewProps {
  stats: TestimonialStats;
}

export function TestimonialOverview({ stats }: TestimonialOverviewProps) {
  const { avgRating, totalReviews, distribution } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm mb-12">
      {/* Average Rating */}
      <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-100 pb-8 md:pb-0">
        <span className="text-6xl font-black text-[#4A3B2E] tracking-tighter">
          {avgRating.toFixed(1)}
        </span>
        <div className="flex gap-1 my-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-6 h-6",
                i < Math.round(avgRating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-amber-200"
              )}
            />
          ))}
        </div>
        <span className="text-zinc-500 font-medium">{totalReviews} ulasan</span>
      </div>

      {/* Distribution Bars */}
      <div className="md:col-span-2 space-y-3 px-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-8">
                <span className="text-sm font-bold text-[#4A3B2E]">{rating}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-zinc-400 w-8 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
