"use client";

import { ArrowRight } from "lucide-react";
import { ScrollContainer } from "@/ui/components/ScrollContainer";
import { HotelCard, Hotel } from "./HotelCard";

const PRIMARY = "#6728E0";

interface RegionSectionProps {
  title: string;
  subtitle?: string;
  hotels: Hotel[];
  cardSize?: "sm" | "md" | "lg";
}

export function RegionSection({
  title,
  subtitle,
  hotels,
  cardSize = "md",
}: RegionSectionProps) {
  return (
    <section className="py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2
              className="text-gray-900 mb-1"
              style={{ fontSize: "1.25rem", fontWeight: 700 }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity font-medium"
            style={{ color: PRIMARY }}
          >
            전체 보기 <ArrowRight size={15} />
          </button>
        </div>

        {/* Scroll container */}
        <ScrollContainer>
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} size={cardSize} />
          ))}
        </ScrollContainer>
      </div>
    </section>
  );
}
