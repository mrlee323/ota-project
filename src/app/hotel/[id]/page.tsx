"use client";

import { useSearchParamsSync } from "@/application/search/useSearchParamsSync";
import { useHotelDetail } from "@/application/hotel/useHotelDetail";
import { useGroupBuyInit } from "@/application/celeb/useGroupBuyInit";
import { useCelebCampaign } from "@/application/celeb/useCelebCampaign";
import { useRatePlans } from "@/application/hotel/useRatePlans";
import { celebIdAtom } from "@/application/celeb/atoms";
import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { fetchCeleb } from "@/infrastructure/celeb/api";
import { determineCampaignStatus } from "@/domain/celeb/validation";
import { CelebProfile } from "@/ui/patterns/celeb/CelebProfile";
import { RatePlanList } from "@/ui/patterns/hotel/RatePlanList";
import { Card, CardContent } from "@/ui/components/Card";
import { ImageWithFallback } from "@/ui/components/ImageWithFallback";
import { DiscountBadge, TextBadge } from "@/ui/components/Badge";
import type { HotelDetail } from "@/domain/hotel/types";

interface HotelDetailPageProps {
  params: { id: string };
}

/** 호텔 상세 페이지 — 검색 파라미터를 URL에서 동기화하여 표시 */
export default function HotelDetailPage({ params }: HotelDetailPageProps) {
  const { id } = params;
  const { searchParams } = useSearchParamsSync();
  const { data: hotel, isLoading, error } = useHotelDetail(id, searchParams);

  // 공동구매 진입 초기화 (URL 파라미터 감지 → atom 설정)
  useGroupBuyInit();

  // 현재 세션의 셀럽 ID 읽기
  const celebId = useAtomValue(celebIdAtom);

  // 셀럽+호텔 캠페인 조회
  const { data: campaign } = useCelebCampaign(celebId, id);

  // 캠페인 상태 판정 (캠페인 데이터가 있을 때만)
  const campaignStatus = campaign
    ? determineCampaignStatus(campaign.startDate, campaign.endDate)
    : null;

  // 캠페인 종료 시 셀럽 전용 요금제를 표시하지 않기 위해 celebId를 null로 전달
  const ratePlanCelebId = campaignStatus === "ENDED" ? null : celebId;

  // 요금제 조회 (셀럽 전용 요금제 포함 여부는 ratePlanCelebId에 의해 결정)
  const {
    data: ratePlans,
    isLoading: isRatePlansLoading,
    error: ratePlansError,
  } = useRatePlans(id, searchParams, ratePlanCelebId);

  // 셀럽 프로필 정보 조회
  const { data: celeb } = useQuery({
    queryKey: ["celeb", "profile", celebId],
    queryFn: () => fetchCeleb(celebId!),
    enabled: !!celebId,
  });

  // 셀럽 프로필 표시 여부: celebId가 있고, 셀럽 데이터와 캠페인이 존재할 때
  const showCelebProfile =
    !!celebId &&
    !!celeb &&
    !!campaignStatus &&
    (campaignStatus === "ACTIVE" || campaignStatus === "ENDED");

  if (isLoading) {
    return <HotelDetailSkeleton />;
  }

  if (error || !hotel) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500">
        호텔 정보를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 조건 요약 바 */}
      <SearchConditionBar
        checkInDate={searchParams?.checkInDate}
        checkOutDate={searchParams?.checkOutDate}
        adultCount={searchParams?.adultCount}
        childrenAges={searchParams?.childrenAges}
      />

      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
        {/* 호텔 이미지 갤러리 */}
        <ImageGallery images={hotel.images} name={hotel.name} />

        {/* 호텔 기본 정보 */}
        <HotelInfo hotel={hotel} />

        {/* 셀럽 프로필 (공동구매 진입 시 표시) */}
        {showCelebProfile && (
          <CelebProfile celeb={celeb} campaignStatus={campaignStatus} />
        )}

        {/* 편의시설 */}
        <AmenitiesSection amenities={hotel.amenities} />

        {/* 요금제 리스트 */}
        <RatePlanList
          ratePlans={ratePlans}
          isLoading={isRatePlansLoading}
          error={ratePlansError}
        />
      </div>
    </div>
  );
}

/** 검색 조건 요약 바 — 체크인/체크아웃, 인원 표시 */
function SearchConditionBar({
  checkInDate,
  checkOutDate,
  adultCount,
  childrenAges,
}: {
  checkInDate?: string;
  checkOutDate?: string;
  adultCount?: number;
  childrenAges?: number[];
}) {
  if (!checkInDate || !checkOutDate || adultCount === undefined) {
    return null;
  }

  // 숙박 일수 계산
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const childrenCount = childrenAges?.length ?? 0;

  // 인원 텍스트 생성
  const guestText =
    childrenCount > 0
      ? `성인 ${adultCount}명, 아동 ${childrenCount}명`
      : `성인 ${adultCount}명`;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">체크인</span>
          <span className="font-medium">{formatDate(checkInDate)}</span>
        </div>
        <span className="text-gray-300">→</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">체크아웃</span>
          <span className="font-medium">{formatDate(checkOutDate)}</span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700">{nights}박</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700">{guestText}</span>
      </div>
    </div>
  );
}

/** 이미지 갤러리 — 메인 이미지 + 서브 이미지 그리드 */
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
      {/* 메인 이미지 */}
      <div className="md:col-span-2 aspect-[16/10]">
        <ImageWithFallback
          src={images[0]}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* 서브 이미지 */}
      <div className="hidden md:flex flex-col gap-2">
        {images.slice(1, 3).map((src, index) => (
          <div key={index} className="flex-1">
            <ImageWithFallback
              src={src}
              alt={`${name} ${index + 2}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 호텔 기본 정보 섹션 */
function HotelInfo({ hotel }: { hotel: HotelDetail }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {hotel.name}
              </h1>
              <TextBadge color="purple">
                {"★".repeat(hotel.stars)}
              </TextBadge>
            </div>
            <p className="text-sm text-gray-500">{hotel.nameEn}</p>
            <p className="text-sm text-gray-500">{hotel.address}</p>
          </div>
          <div className="text-right space-y-1">
            {hotel.discountRate > 0 && (
              <DiscountBadge percent={hotel.discountRate} />
            )}
            {hotel.originalPrice > hotel.discountPrice && (
              <p className="text-sm text-gray-400 line-through">
                {hotel.originalPrice.toLocaleString()}원
              </p>
            )}
            <p className="text-xl font-bold text-gray-900">
              {hotel.discountPrice.toLocaleString()}원
            </p>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed">{hotel.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>체크인 {hotel.checkInTime}</span>
          <span>체크아웃 {hotel.checkOutTime}</span>
          <span>⭐ {hotel.rating}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** 편의시설 섹션 */
function AmenitiesSection({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-bold text-gray-900 mb-3">편의시설</h2>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <TextBadge key={amenity} color="gray">
              {amenity}
            </TextBadge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** 날짜 문자열을 읽기 좋은 형식으로 변환 (YYYY-MM-DD → M월 D일) */
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
}

/** 로딩 스켈레톤 */
function HotelDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 조건 바 스켈레톤 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
        {/* 이미지 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
          <div className="md:col-span-2 aspect-[16/10] bg-gray-200 animate-pulse" />
          <div className="hidden md:flex flex-col gap-2">
            <div className="flex-1 bg-gray-200 animate-pulse" />
            <div className="flex-1 bg-gray-200 animate-pulse" />
          </div>
        </div>
        {/* 정보 스켈레톤 */}
        <Card>
          <CardContent className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
