"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { completePageParamsSchema } from "@/domain/booking/schemas";
import { BookingCompleteView } from "@/ui/patterns/booking/BookingCompleteView";

/** childrenAges JSON 문자열을 number[]로 안전하게 파싱 */
function parseChildrenAges(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "number")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/** 예약 완료 페이지 — 쿼리 파라미터 검증 후 완료 화면 렌더링 */
export default function BookingCompletePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-sm text-gray-500">로딩 중...</p></div>}>
      <BookingCompleteContent />
    </Suspense>
  );
}

function BookingCompleteContent() {
  const searchParams = useSearchParams();

  // 쿼리 파라미터를 객체로 변환 후 Zod 스키마로 검증
  const raw = Object.fromEntries(searchParams.entries());
  const result = completePageParamsSchema.safeParse(raw);

  // 검증 실패 시 오류 메시지 + 홈 링크 표시
  if (!result.success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-red-600">
          유효하지 않은 접근입니다
        </p>
        <p className="mt-2 text-sm text-gray-500">
          필수 결제 결과 데이터가 누락되었습니다.
        </p>
        <Link
          href="/"
          className="mt-4 rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <BookingCompleteView
        bookerName={data.bookerName}
        bookerPhone={data.bookerPhone}
        bookerEmail={data.bookerEmail}
        guestName={data.guestName}
        guestPhone={data.guestInfoPhone}
        hotelName={data.hotelName}
        roomName={data.roomName}
        checkIn={data.checkIn}
        checkOut={data.checkOut}
        adultCount={data.adultCount}
        childrenAges={parseChildrenAges(data.childrenAges)}
        originalAmount={data.originalAmount}
        promotionDiscount={data.promotionDiscount}
        couponDiscount={data.couponDiscount}
        finalAmount={data.finalAmount}
        transactionId={data.transactionId}
        approvalNumber={data.approvalNumber}
      />
    </div>
  );
}
