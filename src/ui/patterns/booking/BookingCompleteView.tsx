"use client";

import { useRouter } from "next/navigation";
import { formatPrice } from "@/ui/patterns/hotel/RatePlanItem";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

export interface BookingCompleteViewProps {
  // 예약자 정보
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  // 투숙객 정보
  guestName: string;
  guestPhone: string;
  // 숙박 정보
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childrenAges: number[];
  // 결제 내역
  originalAmount: number;
  promotionDiscount: number;
  couponDiscount: number;
  finalAmount: number;
  transactionId: string;
  approvalNumber: string;
}

// ─── 유틸 함수 ──────────────────────────────────────────────────────────────

/** YYYY-MM-DD 문자열을 한국어 날짜 형식으로 변환 (예: "2025년 1월 22일") */
function formatDateKorean(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/** 체크인/체크아웃 날짜로 숙박 일수 계산 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/** 인원 텍스트 생성 (예: "성인 2명" 또는 "성인 2명, 아동 1명") */
function formatGuests(adultCount: number, childrenAges: number[]): string {
  const parts = [`성인 ${adultCount}명`];
  if (childrenAges.length > 0) {
    parts.push(`아동 ${childrenAges.length}명`);
  }
  return parts.join(", ");
}

// ─── 섹션 컴포넌트 ──────────────────────────────────────────────────────────

/** 정보 행 (라벨 + 값) */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

/** 섹션 래퍼 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">{children}</dl>
    </section>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

/** 예약 완료 화면 — 예약자/투숙객/숙박/결제 상세 정보 표시 */
export function BookingCompleteView({
  bookerName,
  bookerPhone,
  bookerEmail,
  guestName,
  guestPhone,
  hotelName,
  roomName,
  checkIn,
  checkOut,
  adultCount,
  childrenAges,
  originalAmount,
  promotionDiscount,
  couponDiscount,
  finalAmount,
  transactionId,
  approvalNumber,
}: BookingCompleteViewProps) {
  const router = useRouter();
  const nights = calculateNights(checkIn, checkOut);

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* 완료 안내 */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-3 text-xl font-bold text-gray-900">예약이 완료되었습니다</h1>
      </div>

      {/* 예약자 정보 */}
      <Section title="예약자 정보">
        <InfoRow label="이름" value={bookerName} />
        <InfoRow label="전화번호" value={bookerPhone} />
        <InfoRow label="이메일" value={bookerEmail} />
      </Section>

      {/* 투숙객 정보 */}
      <Section title="투숙객 정보">
        <InfoRow label="이름" value={guestName} />
        <InfoRow label="전화번호" value={guestPhone} />
      </Section>

      {/* 숙박 정보 */}
      <Section title="숙박 정보">
        <InfoRow label="호텔명" value={hotelName} />
        <InfoRow label="객실명" value={roomName} />
        <InfoRow label="체크인" value={formatDateKorean(checkIn)} />
        <InfoRow label="체크아웃" value={formatDateKorean(checkOut)} />
        <InfoRow label="숙박 일수" value={`${nights}박`} />
        <InfoRow label="인원" value={formatGuests(adultCount, childrenAges)} />
      </Section>

      {/* 결제 내역 */}
      <Section title="결제 내역">
        <InfoRow label="객실 요금" value={formatPrice(originalAmount)} />
        {promotionDiscount > 0 && (
          <div className="flex justify-between text-red-500">
            <dt>프로모션 할인</dt>
            <dd className="font-medium">-{formatPrice(promotionDiscount)}</dd>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-red-500">
            <dt>쿠폰 할인</dt>
            <dd className="font-medium">-{formatPrice(couponDiscount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <dt className="font-semibold text-gray-900">최종 결제 금액</dt>
          <dd className="font-bold text-brand">{formatPrice(finalAmount)}</dd>
        </div>
        <InfoRow label="트랜잭션 ID" value={transactionId} />
        <InfoRow label="승인번호" value={approvalNumber} />
      </Section>

      {/* 홈으로 돌아가기 버튼 */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
