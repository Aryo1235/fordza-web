"use client";

import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="group bg-white p-6 rounded-2xl border border-zinc-100 hover:border-amber-200 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full relative">
      <Quote className="absolute top-4 right-4 w-8 h-8 text-amber-500/10 group-hover:text-amber-500/20 transition-colors" />

      <div className="flex flex-col gap-1 mb-4">
        <h3 className="font-bold text-[#4A3B2E] text-lg leading-tight group-hover:text-amber-700 transition-colors">
          {testimonial.customerName}
        </h3>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-amber-200"
              )}
            />
          ))}
        </div>
      </div>

      <p className="text-zinc-600 text-sm leading-relaxed flex-1 italic">
        "{testimonial.content}"
      </p>

      {testimonial.product && (
        <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Membeli: {testimonial.product.name}
          </span>

        </div>
      )}
    </div>
  );
}
