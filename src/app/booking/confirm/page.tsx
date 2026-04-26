"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { confirmPageParamsSchema } from "@/domain/booking/schemas";
import type { BookingSubmitData } from "@/ui/patterns/booking/BookingConfirmForm";
import { BookingConfirmForm } from "@/ui/patterns/booking/BookingConfirmForm";
import { createSearchPersistenceAdapter } from "@/infrastructure/search/searchPersistence";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import type { SearchParams } from "@/domain/search/types";

/** 예약 확인 페이지 — 쿼리 파라미터 + 영속화 저장소에서 데이터를 조합하여 예약 폼 렌더링 */
export default function BookingConfirmPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-gray-500">로딩 중...</p></div>}>
      <BookingConfirmContent />
    </Suspense>
  );
}

function BookingConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 영속화 저장소에서 검색 파라미터(날짜, 인원) 로드 상태
  const [searchData, setSearchData] = useState<SearchParams | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 클라이언트 마운트 시 영속화 저장소에서 검색 파라미터 읽기
  useEffect(() => {
    const adapter = createSearchPersistenceAdapter();
    const loaded = adapter.load();
    // 영속화 저장소에 데이터가 없으면 기본값으로 폴백
    setSearchData(loaded ?? createDefaultSearchParams());
    setIsLoaded(true);
  }, []);

  // 쿼리 파라미터를 객체로 변환 후 Zod 스키마로 검증 (roomId, roomName, price, hotelName)
  const raw = Object.fromEntries(searchParams.entries());
  const result = confirmPageParamsSchema.safeParse(raw);

  // 검증 실패 시 오류 메시지 + 홈 링크 표시
  if (!result.success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-red-600">
          유효하지 않은 접근입니다
        </p>
        <p className="mt-2 text-sm text-gray-500">
          필수 객실 정보가 누락되었습니다.
        </p>
        <Link
          href="/"
          className="mt-4 rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          호텔 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 영속화 저장소 로딩 중 표시
  if (!isLoaded || !searchData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">예약 정보를 불러오는 중...</p>
      </div>
    );
  }

  const { roomId, roomName, price, hotelName } = result.data;

  // 결제하기 클릭 시 모든 예약 데이터를 쿼리 파라미터로 포함하여 /booking/payment로 이동
  const handleSubmit = (data: BookingSubmitData) => {
    const params = new URLSearchParams({
      roomId,
      roomName,
      price: String(price),
      hotelName,
      checkIn: searchData.checkInDate,
      checkOut: searchData.checkOutDate,
      guestName: data.bookerInfo.name,
      adultCount: String(searchData.adultCount),
      childrenAges: JSON.stringify(searchData.childrenAges),
      bookerName: data.bookerInfo.name,
      bookerPhone: data.bookerInfo.phone,
      bookerEmail: data.bookerInfo.email,
      guestInfoName: data.guestInfo.name,
      guestInfoPhone: data.guestInfo.phone,
      promotionDiscount: String(data.discountInfo.promotionDiscount),
      couponDiscount: String(data.discountInfo.couponDiscount),
    });
    if (data.discountInfo.promotionId) {
      params.set("promotionId", data.discountInfo.promotionId);
    }
    if (data.discountInfo.couponCode) {
      params.set("couponCode", data.discountInfo.couponCode);
    }
    router.push(`/booking/payment?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
        예약 확인
      </h1>
      <BookingConfirmForm
        hotelName={hotelName}
        roomName={roomName}
        price={price}
        checkIn={searchData.checkInDate}
        checkOut={searchData.checkOutDate}
        adultCount={searchData.adultCount}
        childrenAges={searchData.childrenAges}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
