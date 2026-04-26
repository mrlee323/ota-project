"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/ui/components/ImageWithFallback";
import { DiscountBadge } from "@/ui/components/Badge";
import { useActiveCelebBanners } from "@/application/celeb/useCelebCampaign";
import { searchParamsAtom } from "@/application/search/atoms";
import { serializeSearchParams } from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import type { CelebBannerItem } from "@/domain/celeb/types";
import type { SearchParams } from "@/domain/search/types";

/** 자동 슬라이드 간격 (ms) */
const AUTO_SLIDE_INTERVAL = 5000;

/** 배너 클릭 시 이동할 URL을 생성한다 */
export function buildBannerHref(
  hotelId: string,
  celebId: string,
  searchParams: SearchParams,
): string {
  const searchQuery = serializeSearchParams(searchParams);
  return `/hotel/${hotelId}?utm_source=celeb&celeb_id=${celebId}&${searchQuery}`;
}

/** 개별 배너 슬라이드 */
function BannerSlide({ banner }: { banner: CelebBannerItem }) {
  const currentSearchParams = useAtomValue(searchParamsAtom);

  // 배너 클릭 시 이동할 URL 생성
  const href = useMemo(() => {
    const params = currentSearchParams ?? createDefaultSearchParams();
    return buildBannerHref(banner.hotelId, banner.celeb.id, params);
  }, [banner.hotelId, banner.celeb.id, currentSearchParams]);

  return (
    <Link href={href} className="block relative w-full h-full shrink-0">
      {/* 배너 배경 이미지 */}
      <ImageWithFallback
        src={banner.bannerImageUrl}
        alt={`${banner.celeb.name} x ${banner.hotelName} 공동구매`}
        className="w-full h-full object-cover"
      />

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* 배너 정보 */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
        {/* 셀럽 프로필 이미지 */}
        <div className="shrink-0">
          <ImageWithFallback
            src={banner.celeb.profileImageUrl}
            alt={banner.celeb.name}
            className="w-14 h-14 rounded-full border-2 border-white object-cover"
          />
        </div>

        {/* 텍스트 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium mb-0.5">
            {banner.celeb.name}의 공동구매
          </p>
          <h3 className="text-white text-lg font-bold truncate">
            {banner.hotelName}
          </h3>
        </div>

        {/* 할인율 */}
        <div className="shrink-0">
          <DiscountBadge percent={banner.discountRate} />
        </div>
      </div>
    </Link>
  );
}

/** 메인 페이지 셀럽 공동구매 배너 캐러셀 */
export function CelebBanner() {
  const { data: banners, isLoading } = useActiveCelebBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const bannerCount = banners?.length ?? 0;

  // 다음 슬라이드로 이동
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % bannerCount);
  }, [bannerCount]);

  // 이전 슬라이드로 이동
  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + bannerCount) % bannerCount);
  }, [bannerCount]);

  // 자동 슬라이드
  useEffect(() => {
    if (bannerCount <= 1 || isPaused) return;

    const timer = setInterval(goNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [bannerCount, isPaused, goNext]);

  // 배너 인덱스가 범위를 벗어나지 않도록 보정
  useEffect(() => {
    if (bannerCount > 0 && currentIndex >= bannerCount) {
      setCurrentIndex(0);
    }
  }, [bannerCount, currentIndex]);

  // 로딩 중이거나 활성 캠페인이 없으면 렌더링하지 않음
  if (isLoading || !banners || banners.length === 0) {
    return null;
  }

  return (
    <section
      className="relative max-w-[1200px] mx-auto px-4 py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="셀럽 공동구매 배너"
    >
      <div className="relative h-[180px] rounded-2xl overflow-hidden">
        {/* 슬라이드 트랙 */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.campaignId} className="w-full h-full shrink-0">
              <BannerSlide banner={banner} />
            </div>
          ))}
        </div>

        {/* 좌우 네비게이션 버튼 (배너 2개 이상일 때만) */}
        {bannerCount > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
              aria-label="이전 배너"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
              aria-label="다음 배너"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </>
        )}

        {/* 인디케이터 (배너 2개 이상일 때만) */}
        {bannerCount > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((banner, idx) => (
              <button
                key={banner.campaignId}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`배너 ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
