// ─── 할인 계산 순수 함수 ────────────────────────────────────────────────────
// 프로모션과 쿠폰 할인을 순서대로 적용하는 도메인 로직.
// 프레임워크 의존성 없이 순수 TypeScript로 구현.

/** 할인 계산 입력 */
export interface DiscountInput {
  /** 원래 금액 */
  originalAmount: number;
  /** 프로모션 할인 금액 */
  promotionDiscount: number;
  /** 쿠폰 할인 금액 */
  couponDiscount: number;
}

/** 할인 계산 결과 */
export interface DiscountResult {
  /** 원래 금액 */
  originalAmount: number;
  /** 실제 적용된 프로모션 할인 금액 */
  promotionDiscount: number;
  /** 실제 적용된 쿠폰 할인 금액 */
  couponDiscount: number;
  /** 총 할인 금액 (프로모션 + 쿠폰) */
  totalDiscount: number;
  /** 최종 결제 금액 (0원 미만 불가) */
  finalAmount: number;
}

/**
 * 할인 적용 순서: 프로모션 → 쿠폰.
 * 최종 금액은 0원 미만이 되지 않는다.
 * 실제 적용된 할인 금액만 결과에 포함한다 (원래 금액 초과 할인 방지).
 */
export function calculateDiscount(input: DiscountInput): DiscountResult {
  // 1단계: 프로모션 할인 적용 (0원 미만 방지)
  const afterPromotion = Math.max(0, input.originalAmount - input.promotionDiscount);

  // 2단계: 쿠폰 할인 적용 (0원 미만 방지)
  const afterCoupon = Math.max(0, afterPromotion - input.couponDiscount);

  // 실제 적용된 할인 금액 계산 (원래 금액 초과 할인 방지)
  const effectivePromotionDiscount = input.originalAmount - afterPromotion;
  const effectiveCouponDiscount = afterPromotion - afterCoupon;

  return {
    originalAmount: input.originalAmount,
    promotionDiscount: effectivePromotionDiscount,
    couponDiscount: effectiveCouponDiscount,
    totalDiscount: effectivePromotionDiscount + effectiveCouponDiscount,
    finalAmount: afterCoupon,
  };
}
