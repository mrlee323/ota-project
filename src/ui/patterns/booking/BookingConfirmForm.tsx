"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/ui/patterns/hotel/RatePlanItem";
import { bookerInfoSchema, guestInfoSchema } from "@/domain/booking/schemas";
import type { DiscountInfo } from "@/domain/booking/schemas";
import { calculateDiscount } from "@/domain/booking/discount";
import { CouponInput } from "@/ui/patterns/booking/CouponInput";

// ─── 타입 정의 ──────────────────────────────────────────────────────────────

export interface BookingConfirmFormProps {
  /** 호텔명 */
  hotelName: string;
  /** 객실명 */
  roomName: string;
  /** 1박 가격 */
  price: number;
  /** 체크인 날짜 (YYYY-MM-DD) */
  checkIn: string;
  /** 체크아웃 날짜 (YYYY-MM-DD) */
  checkOut: string;
  /** 성인 수 */
  adultCount: number;
  /** 아동 나이 배열 */
  childrenAges: number[];
  /** 결제하기 클릭 핸들러 */
  onSubmit: (data: BookingSubmitData) => void;
}

export interface BookingSubmitData {
  bookerInfo: { name: string; phone: string; email: string; emailConfirm: string };
  guestInfo: { name: string; phone: string };
  discountInfo: DiscountInfo;
}

// ─── 프로모션 목 데이터 ─────────────────────────────────────────────────────

interface Promotion {
  id: string;
  name: string;
  discount: number;
  description: string;
}

const MOCK_PROMOTIONS: Promotion[] = [
  { id: "promo-early", name: "얼리버드 할인", discount: 15000, description: "14일 전 예약 시 15,000원 할인" },
  { id: "promo-long", name: "연박 할인", discount: 20000, description: "3박 이상 시 20,000원 할인" },
  { id: "promo-member", name: "회원 특별 할인", discount: 10000, description: "회원 전용 10,000원 할인" },
];

// ─── 쿠폰 검증 목 함수 ─────────────────────────────────────────────────────

const VALID_COUPONS: Record<string, number> = {
  WELCOME10: 10000,
  SUMMER20: 20000,
  VIP30: 30000,
};

async function validateCoupon(code: string): Promise<{ discount: number } | null> {
  // 실제 API 호출을 시뮬레이션
  await new Promise((r) => setTimeout(r, 300));
  const discount = VALID_COUPONS[code.toUpperCase()];
  return discount ? { discount } : null;
}

// ─── 유틸리티 ───────────────────────────────────────────────────────────────

/** 체크인/체크아웃 날짜로 숙박 일수 계산 */
function calculateNights(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** 날짜를 한국어 형식으로 포맷 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// ─── 필드 에러 추출 헬퍼 ────────────────────────────────────────────────────

type FieldErrors = Record<string, string | undefined>;

function getBookerErrors(data: {
  name: string; phone: string; email: string; emailConfirm: string;
}): FieldErrors {
  const result = bookerInfoSchema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as string;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function getGuestErrors(data: { name: string; phone: string }): FieldErrors {
  const result = guestInfoSchema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as string;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

/** 고도화된 예약 확인 폼 — 숙박 요약, 예약자/투숙객 정보, 프로모션/쿠폰, 결제 금액 요약 */
export function BookingConfirmForm({
  hotelName,
  roomName,
  price,
  checkIn,
  checkOut,
  adultCount,
  childrenAges,
  onSubmit,
}: BookingConfirmFormProps) {
  const router = useRouter();
  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = price * nights;

  // ─── 예약자 정보 상태 ─────────────────────────────────────────────────
  const [bookerName, setBookerName] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");
  const [bookerEmailConfirm, setBookerEmailConfirm] = useState("");
  const [bookerTouched, setBookerTouched] = useState<Record<string, boolean>>({});

  // ─── 투숙객 정보 상태 ─────────────────────────────────────────────────
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [sameAsBooker, setSameAsBooker] = useState(false);
  const [guestTouched, setGuestTouched] = useState<Record<string, boolean>>({});

  // ─── 프로모션/쿠폰 상태 ───────────────────────────────────────────────
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // ─── Zod 실시간 검증 ──────────────────────────────────────────────────
  const bookerData = { name: bookerName, phone: bookerPhone, email: bookerEmail, emailConfirm: bookerEmailConfirm };
  const bookerErrors = useMemo(() => getBookerErrors(bookerData), [bookerName, bookerPhone, bookerEmail, bookerEmailConfirm]);
  const isBookerValid = Object.keys(bookerErrors).length === 0;

  const guestData = sameAsBooker
    ? { name: bookerName, phone: bookerPhone }
    : { name: guestName, phone: guestPhone };
  const guestErrors = useMemo(
    () => (sameAsBooker ? getGuestErrors({ name: bookerName, phone: bookerPhone }) : getGuestErrors({ name: guestName, phone: guestPhone })),
    [sameAsBooker, bookerName, bookerPhone, guestName, guestPhone],
  );
  const isGuestValid = Object.keys(guestErrors).length === 0;

  // ─── 할인 계산 ────────────────────────────────────────────────────────
  const discountResult = useMemo(
    () =>
      calculateDiscount({
        originalAmount: totalPrice,
        promotionDiscount: selectedPromotion?.discount ?? 0,
        couponDiscount,
      }),
    [totalPrice, selectedPromotion, couponDiscount],
  );

  // ─── 폼 유효성 ────────────────────────────────────────────────────────
  const isFormValid = isBookerValid && isGuestValid;

  // ─── "예약자와 동일" 체크박스 핸들러 ──────────────────────────────────
  const handleSameAsBooker = useCallback(
    (checked: boolean) => {
      setSameAsBooker(checked);
      if (checked) {
        setGuestName(bookerName);
        setGuestPhone(bookerPhone);
      } else {
        setGuestName("");
        setGuestPhone("");
      }
      setGuestTouched({});
    },
    [bookerName, bookerPhone],
  );

  // ─── 쿠폰 핸들러 ─────────────────────────────────────────────────────
  const handleCouponApply = useCallback(async (code: string) => {
    return validateCoupon(code);
  }, []);

  const handleCouponSuccess = useCallback((code: string, discount: number) => {
    setAppliedCoupon(code);
    setCouponDiscount(discount);
  }, []);

  const handleCouponRemove = useCallback(() => {
    setAppliedCoupon(undefined);
    setCouponDiscount(0);
  }, []);

  // ─── 제출 핸들러 ──────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onSubmit({
      bookerInfo: bookerData,
      guestInfo: guestData,
      discountInfo: {
        promotionId: selectedPromotion?.id,
        promotionDiscount: discountResult.promotionDiscount,
        couponCode: appliedCoupon,
        couponDiscount: discountResult.couponDiscount,
      },
    });
  };

  // ─── 인원 텍스트 ──────────────────────────────────────────────────────
  const guestCountText = childrenAges.length > 0
    ? `성인 ${adultCount}명, 아동 ${childrenAges.length}명`
    : `성인 ${adultCount}명`;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 p-4">
      {/* ── 1. 숙박 요약 ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold text-gray-900">숙박 요약</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">호텔명</dt>
            <dd className="font-medium text-gray-900">{hotelName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">객실명</dt>
            <dd className="font-medium text-gray-900">{roomName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">체크인</dt>
            <dd className="font-medium text-gray-900">{formatDate(checkIn)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">체크아웃</dt>
            <dd className="font-medium text-gray-900">{formatDate(checkOut)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">숙박 일수</dt>
            <dd className="font-medium text-gray-900">{nights}박</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">인원</dt>
            <dd className="font-medium text-gray-900">{guestCountText}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <dt className="text-gray-500">금액</dt>
            <dd className="font-bold text-brand">{formatPrice(totalPrice)}</dd>
          </div>
        </dl>
      </section>

      {/* ── 2. 예약자 정보 ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold text-gray-900">예약자 정보</h2>
        <div className="mt-3 space-y-4">
          {/* 이름 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></span>
            <input
              type="text"
              value={bookerName}
              onChange={(e) => setBookerName(e.target.value)}
              onBlur={() => setBookerTouched((p) => ({ ...p, name: true }))}
              placeholder="홍길동"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {bookerTouched.name && bookerErrors.name && (
              <p className="mt-1 text-xs text-red-500">{bookerErrors.name}</p>
            )}
          </label>

          {/* 전화번호 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">전화번호 <span className="text-red-500">*</span></span>
            <input
              type="tel"
              value={bookerPhone}
              onChange={(e) => setBookerPhone(e.target.value)}
              onBlur={() => setBookerTouched((p) => ({ ...p, phone: true }))}
              placeholder="010-1234-5678"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {bookerTouched.phone && bookerErrors.phone && (
              <p className="mt-1 text-xs text-red-500">{bookerErrors.phone}</p>
            )}
          </label>

          {/* 이메일 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">이메일 <span className="text-red-500">*</span></span>
            <input
              type="email"
              value={bookerEmail}
              onChange={(e) => setBookerEmail(e.target.value)}
              onBlur={() => setBookerTouched((p) => ({ ...p, email: true }))}
              placeholder="example@email.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {bookerTouched.email && bookerErrors.email && (
              <p className="mt-1 text-xs text-red-500">{bookerErrors.email}</p>
            )}
          </label>

          {/* 이메일 확인 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">이메일 확인 <span className="text-red-500">*</span></span>
            <input
              type="email"
              value={bookerEmailConfirm}
              onChange={(e) => setBookerEmailConfirm(e.target.value)}
              onBlur={() => setBookerTouched((p) => ({ ...p, emailConfirm: true }))}
              placeholder="example@email.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {bookerTouched.emailConfirm && bookerErrors.emailConfirm && (
              <p className="mt-1 text-xs text-red-500">{bookerErrors.emailConfirm}</p>
            )}
          </label>
        </div>
      </section>

      {/* ── 3. 투숙객 정보 ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">투숙객 정보</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={sameAsBooker}
              onChange={(e) => handleSameAsBooker(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            예약자와 동일
          </label>
        </div>
        <div className="mt-3 space-y-4">
          {/* 이름 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">이름 <span className="text-red-500">*</span></span>
            <input
              type="text"
              value={sameAsBooker ? bookerName : guestName}
              onChange={(e) => !sameAsBooker && setGuestName(e.target.value)}
              onBlur={() => !sameAsBooker && setGuestTouched((p) => ({ ...p, name: true }))}
              readOnly={sameAsBooker}
              placeholder="홍길동"
              className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${sameAsBooker ? "bg-gray-100 text-gray-500" : ""}`}
            />
            {!sameAsBooker && guestTouched.name && guestErrors.name && (
              <p className="mt-1 text-xs text-red-500">{guestErrors.name}</p>
            )}
          </label>

          {/* 전화번호 */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">전화번호 <span className="text-red-500">*</span></span>
            <input
              type="tel"
              value={sameAsBooker ? bookerPhone : guestPhone}
              onChange={(e) => !sameAsBooker && setGuestPhone(e.target.value)}
              onBlur={() => !sameAsBooker && setGuestTouched((p) => ({ ...p, phone: true }))}
              readOnly={sameAsBooker}
              placeholder="010-1234-5678"
              className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${sameAsBooker ? "bg-gray-100 text-gray-500" : ""}`}
            />
            {!sameAsBooker && guestTouched.phone && guestErrors.phone && (
              <p className="mt-1 text-xs text-red-500">{guestErrors.phone}</p>
            )}
          </label>
        </div>
      </section>

      {/* ── 4. 프로모션 ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold text-gray-900">프로모션</h2>
        <div className="mt-3 space-y-2">
          {MOCK_PROMOTIONS.map((promo) => (
            <label
              key={promo.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                selectedPromotion?.id === promo.id
                  ? "border-brand bg-brand/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="promotion"
                checked={selectedPromotion?.id === promo.id}
                onChange={() =>
                  setSelectedPromotion(
                    selectedPromotion?.id === promo.id ? null : promo,
                  )
                }
                className="h-4 w-4 text-brand focus:ring-brand"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{promo.name}</p>
                <p className="text-xs text-gray-500">{promo.description}</p>
              </div>
              <span className="text-sm font-bold text-brand">
                -{formatPrice(promo.discount)}
              </span>
            </label>
          ))}
          {selectedPromotion && (
            <button
              type="button"
              onClick={() => setSelectedPromotion(null)}
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              프로모션 선택 해제
            </button>
          )}
        </div>
      </section>

      {/* ── 5. 쿠폰 ─────────────────────────────────────────────────── */}
      <CouponInput
        onApply={handleCouponApply}
        onSuccess={handleCouponSuccess}
        appliedCoupon={appliedCoupon}
        onRemove={handleCouponRemove}
      />

      {/* ── 6. 결제 금액 요약 ────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold text-gray-900">결제 금액</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">객실 요금 ({nights}박)</dt>
            <dd className="font-medium text-gray-900">{formatPrice(discountResult.originalAmount)}</dd>
          </div>
          {discountResult.promotionDiscount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">프로모션 할인</dt>
              <dd className="font-medium text-red-500">-{formatPrice(discountResult.promotionDiscount)}</dd>
            </div>
          )}
          {discountResult.couponDiscount > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500">쿠폰 할인</dt>
              <dd className="font-medium text-red-500">-{formatPrice(discountResult.couponDiscount)}</dd>
            </div>
          )}
          {discountResult.totalDiscount > 0 && (
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt className="text-gray-500">총 할인</dt>
              <dd className="font-medium text-red-500">-{formatPrice(discountResult.totalDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <dt className="font-bold text-gray-900">최종 결제 금액</dt>
            <dd className="text-lg font-bold text-brand">{formatPrice(discountResult.finalAmount)}</dd>
          </div>
        </dl>
      </section>

      {/* ── 7. 버튼 영역 ─────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          이전으로
        </button>
        <button
          type="submit"
          disabled={!isFormValid}
          className="flex-1 rounded-lg bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          결제하기
        </button>
      </div>
    </form>
  );
}
