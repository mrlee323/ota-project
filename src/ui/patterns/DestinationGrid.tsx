"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

const PRIMARY = "#6728E0";

interface Destination {
  name: string;
  image: string;
  hotelCount?: number;
}

function DestinationCard({ dest }: { dest: Destination }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-2xl overflow-hidden mb-2 aspect-square">
        <img
          src={dest.image}
          alt={dest.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-bold drop-shadow">
          {dest.name}
        </div>
      </div>
      {dest.hotelCount && (
        <div className="text-xs text-gray-400 text-center">
          {dest.hotelCount.toLocaleString()}개 숙소
        </div>
      )}
    </div>
  );
}

interface DestinationGridProps {
  domestic: Destination[];
  overseas: Destination[];
}

export function DestinationGrid({ domestic, overseas }: DestinationGridProps) {
  const [activeTab, setActiveTab] = useState<"domestic" | "overseas">("domestic");
  const list = activeTab === "domestic" ? domestic : overseas;

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2
              className="text-gray-900"
              style={{ fontSize: "1.25rem", fontWeight: 700 }}
            >
              인기 여행지
            </h2>
            {/* Tab toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => setActiveTab("domestic")}
                className="px-4 py-1.5 rounded-md text-sm transition-all"
                style={
                  activeTab === "domestic"
                    ? { backgroundColor: PRIMARY, color: "#fff", fontWeight: 600 }
                    : { color: "#666" }
                }
              >
                국내
              </button>
              <button
                onClick={() => setActiveTab("overseas")}
                className="px-4 py-1.5 rounded-md text-sm transition-all"
                style={
                  activeTab === "overseas"
                    ? { backgroundColor: PRIMARY, color: "#fff", fontWeight: 600 }
                    : { color: "#666" }
                }
              >
                해외
              </button>
            </div>
          </div>
          <button
            className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity font-medium"
            style={{ color: PRIMARY }}
          >
            더보기 <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {list.map((dest) => (
            <DestinationCard key={dest.name} dest={dest} />
          ))}
        </div>
      </div>
    </section>
  );
}
