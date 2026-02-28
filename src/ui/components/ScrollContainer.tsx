"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollContainerProps {
  children: React.ReactNode;
  scrollAmount?: number;
}

export function ScrollContainer({ children, scrollAmount = 540 }: ScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={18} className="text-gray-700" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute -right-4 top-[35%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
