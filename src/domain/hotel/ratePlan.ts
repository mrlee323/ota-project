import { z } from "zod";

// ─── Zod 스키마 정의 ────────────────────────────────────────────────────────

/** 일반 요금제 스키마 */
export const ratePlanSchema = z.object({
  /** 요금제 고유 ID */
  id: z.string().min(1),
  /** 객실 타입명 */
  roomTypeName: z.string().min(1),
  /** 1박 기준 가격 */
  pricePerNight: z.number().nonnegative(),
  /** 최대 수용 인원 */
  maxOccupancy: z.number().int().positive(),
  /** 포함 서비스 목록 */
  includedServices: z.array(z.string()),
  /** 취소 정책 */
  cancellationPolicy: z.string(),
});

/** 셀럽 전용 요금제 스키마 — RatePlan 확장 */
export const celebRatePlanSchema = ratePlanSchema.extend({
  /** 연결된 셀럽 ID */
  celebId: z.string().min(1),
  /** 할인율 (퍼센트) */
  discountRate: z.number().min(0).max(100),
  /** 할인 적용 가격 */
  discountedPrice: z.number().nonnegative(),
});

// ─── TypeScript 타입 (Zod 스키마에서 추론) ──────────────────────────────────

/** 일반 요금제 */
export type RatePlan = z.infer<typeof ratePlanSchema>;

/** 셀럽 전용 요금제 */
export type CelebRatePlan = z.infer<typeof celebRatePlanSchema>;

// ─── 타입 가드 ──────────────────────────────────────────────────────────────

/** 요금제가 셀럽 전용인지 판별하는 타입 가드 */
export function isCelebRatePlan(
  plan: RatePlan | CelebRatePlan,
): plan is CelebRatePlan {
  return (
    "celebId" in plan &&
    "discountRate" in plan &&
    "discountedPrice" in plan
  );
}

// ─── 정렬 함수 ──────────────────────────────────────────────────────────────

/**
 * 요금제 배열을 정렬한다.
 * 셀럽 전용 요금제를 일반 요금제보다 상단에 배치한다.
 * 원본 배열을 변경하지 않고 새 배열을 반환한다.
 */
export function sortRatePlans<T extends RatePlan>(plans: T[]): T[] {
  return [...plans].sort((a, b) => {
    const aIsCeleb = isCelebRatePlan(a) ? 0 : 1;
    const bIsCeleb = isCelebRatePlan(b) ? 0 : 1;
    return aIsCeleb - bIsCeleb;
  });
}
