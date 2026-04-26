"use client";

import { useAtom } from "jotai";
import { selectedRegionIndexAtom } from "@/application/hotel/regionShowcaseAtoms";
import { useRegionShowcase } from "@/application/hotel/useRegionShowcase";
import {
  getHotelsForRegion,
  getRegionTab,
} from "@/domain/hotel/showcaseTypes";
import { ScrollContainer } from "@/ui/components/ScrollContainer";
import { RegionHero } from "@/ui/patterns/RegionHero";
import { ShowcaseHotelCard } from "@/ui/patterns/ShowcaseHotelCard";

/** 쇼케이스 섹션 로딩 시 표시되는 스켈레톤 UI */
function RegionShowcaseSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* 프로모션 타이틀 스켈레톤 */}
      <div className="h-7 bg-gray-200 rounded w-64" />

      {/* 탭 스켈레톤 */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-full w-20" />
        ))}
      </div>

      {/* 히어로 스켈레톤 */}
      <div className="h-[240px] md:h-[320px] bg-gray-200 rounded-2xl" />

      {/* 호텔 카드 스켈레톤 */}
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[240px] shrink-0">
            <div className="h-[160px] bg-gray-200 rounded-2xl mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 지역별 호텔 쇼케이스 섹션 — 프로모션 타이틀, 지역 탭, 히어로, 호텔 카드 리스트를 조합한다 */
export function RegionShowcase() {
  const { data, isLoading, error } = useRegionShowcase();
  const [selectedIndex, setSelectedIndex] = useAtom(selectedRegionIndexAtom);

  // 로딩 상태
  if (isLoading) {
    return (
      <section className="py-10" aria-label="지역별 호텔 쇼케이스">
        <div className="max-w-[1200px] mx-auto px-4">
          <RegionShowcaseSkeleton />
        </div>
      </section>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <section className="py-10" aria-label="지역별 호텔 쇼케이스">
        <div className="max-w-[1200px] mx-auto px-4">
          <p className="text-center text-gray-500 py-12" role="alert">
            호텔 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </section>
    );
  }

  const currentTab = getRegionTab(data, selectedIndex);
  const hotels = getHotelsForRegion(data, selectedIndex);

  return (
    <section className="py-10" aria-label="지역별 호텔 쇼케이스">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* 프로모션 타이틀 */}
        <h2 className="text-gray-900 text-xl font-bold mb-5">
          {data.promoTitle}
        </h2>

        {/* 지역 탭 목록 */}
        <nav aria-label="지역 선택">
          <div
            role="tablist"
            className="flex flex-nowrap gap-2 mb-6 lg:flex-wrap overflow-x-auto scrollbar-hide"
          >
            {data.regions.map((region, idx) => (
              <button
                key={region.tab.id}
                role="tab"
                aria-selected={idx === selectedIndex}
                tabIndex={0}
                onClick={() => setSelectedIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIndex(idx);
                  }
                }}
                className={`px-5 py-2 rounded-full text-sm border transition-all whitespace-nowrap shrink-0 ${
                  idx === selectedIndex
                    ? "bg-gray-900 text-white border-gray-900 font-semibold"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {region.tab.name}
              </button>
            ))}
          </div>
        </nav>

        {/* 지역 히어로 영역 */}
        {currentTab && (
          <div className="mb-6">
            <RegionHero
              backgroundImage={currentTab.backgroundImageUrl}
              regionName={currentTab.name}
              themeText={currentTab.themeText}
              viewAllHref={`/region/${currentTab.id}`}
            />
          </div>
        )}

        {/* 호텔 카드 리스트 */}
        {hotels.length > 0 ? (
          <ScrollContainer>
            {hotels.map((hotel) => (
              <ShowcaseHotelCard key={hotel.id} hotel={hotel} />
            ))}
          </ScrollContainer>
        ) : (
          <p className="text-center text-gray-400 py-8">
            해당 지역에 표시할 호텔이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
