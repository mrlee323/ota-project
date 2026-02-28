"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ScrollContainer } from "@/ui/components/ScrollContainer";
import { HotelCard, Hotel } from "./HotelCard";

const PRIMARY = "#6728E0";

interface TabData {
  label: string;
  hotels: Hotel[];
}

interface TabRegionSectionProps {
  title: string;
  tabs: TabData[];
  cardSize?: "sm" | "md" | "lg";
}

export function TabRegionSection({
  title,
  tabs,
  cardSize = "lg",
}: TabRegionSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-10">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <h2
            className="text-gray-900"
            style={{ fontSize: "1.25rem", fontWeight: 700 }}
          >
            {title}
          </h2>
          <button
            className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity font-medium"
            style={{ color: PRIMARY }}
          >
            전체 보기 <ArrowRight size={15} />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className="px-5 py-2 rounded-full text-sm border transition-all"
              style={
                activeTab === idx
                  ? {
                      backgroundColor: "#111111",
                      color: "#fff",
                      borderColor: "#111111",
                      fontWeight: 600,
                    }
                  : {
                      backgroundColor: "#fff",
                      color: "#666",
                      borderColor: "#DDDDDD",
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <ScrollContainer>
          {tabs[activeTab]?.hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} size={cardSize} />
          ))}
        </ScrollContainer>
      </div>
    </section>
  );
}
