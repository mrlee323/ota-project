"use client";

import { useHotelMain } from "@/application/hotel/useHotelMain";
import { Footer } from "@/ui/layouts/Footer";
import { HotelSearchBar } from "@/ui/patterns/HotelSearchBar";
import { DestinationGrid } from "@/ui/patterns/DestinationGrid";
import { RegionSection } from "@/ui/patterns/RegionSection";
import { TabRegionSection } from "@/ui/patterns/TabRegionSection";
import { MainSkeleton } from "@/ui/patterns/MainSkeleton";

export default function Home() {
  const { data, isLoading, error } = useHotelMain();

  return (
    <div className="min-h-screen bg-white">
      <HotelSearchBar />

      {isLoading && <MainSkeleton />}

      {error && (
        <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {data && (
        <>
          {/* 인기 여행지 그리드 */}
          <DestinationGrid
            domestic={data.domesticDests}
            overseas={data.overseasDests}
          />

          {/* 서울 인기 호텔 */}
          <RegionSection
            title="🏙️ 서울 인기 호텔"
            subtitle="비즈니스부터 호캉스까지, 서울 최고의 호텔"
            hotels={data.seoulHotels}
            cardSize="lg"
          />

          <div className="max-w-[1200px] mx-auto px-4">
            <hr className="border-gray-100" />
          </div>

          {/* 부산 인기 호텔 */}
          <RegionSection
            title="🌊 부산 인기 호텔"
            subtitle="오션뷰와 해운대 바다를 품은 부산의 호텔"
            hotels={data.busanHotels}
            cardSize="lg"
          />

          <div className="max-w-[1200px] mx-auto px-4">
            <hr className="border-gray-100" />
          </div>

          {/* 제주도 인기 호텔 */}
          <RegionSection
            title="🌺 제주도 인기 호텔"
            subtitle="자연과 함께하는 제주의 특별한 숙소"
            hotels={data.jejuHotels}
            cardSize="lg"
          />

          <div className="max-w-[1200px] mx-auto px-4">
            <hr className="border-gray-100" />
          </div>

          {/* 호캉스 탭 섹션 */}
          <TabRegionSection
            title="🏖️ 호캉스 어디로 갈까?"
            tabs={data.hokangsTabs}
            cardSize="lg"
          />

          <div className="max-w-[1200px] mx-auto px-4">
            <hr className="border-gray-100" />
          </div>

          {/* 강원 인기 호텔 */}
          <RegionSection
            title="⛰️ 강원 인기 호텔"
            subtitle="설악산과 동해를 품은 강원도의 숙소"
            hotels={data.gangwonHotels}
            cardSize="lg"
          />

          <div className="max-w-[1200px] mx-auto px-4">
            <hr className="border-gray-100" />
          </div>

          {/* 경주 인기 호텔 */}
          <RegionSection
            title="🏛️ 경주 인기 호텔"
            subtitle="천년 고도 경주에서 즐기는 역사 여행"
            hotels={data.gyeongjuHotels}
            cardSize="lg"
          />

          {/* 해외 호텔 탭 */}
          <div className="bg-gray-50 py-2">
            <TabRegionSection
              title="✈️ 해외 인기 호텔"
              tabs={data.overseasTabs}
              cardSize="lg"
            />
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
