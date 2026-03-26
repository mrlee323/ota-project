import { DiscountBadge } from "@/ui/components/Badge";
import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";
import { isCelebRatePlan } from "@/domain/hotel/ratePlan";

// ─── 포맷 헬퍼 (테스트 가능하도록 export) ───────────────────────────────────

/** 가격을 한국 원화 형식으로 포맷 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/** 최대 수용 인원 텍스트 */
export function formatOccupancy(max: number): string {
  return `최대 ${max}인`;
}

/** 포함 서비스 목록을 쉼표 구분 문자열로 변환 */
export function formatServices(services: string[]): string {
  return services.join(", ");
}

// ─── 컴포넌트 ───────────────────────────────────────────────────────────────

interface RatePlanItemProps {
  /** 요금제 (일반 또는 셀럽 전용) */
  ratePlan: RatePlan | CelebRatePlan;
}

/** 요금제 항목 — 일반/셀럽 전용 요금제를 조건부 렌더링 */
export function RatePlanItem({ ratePlan }: RatePlanItemProps) {
  const isCeleb = isCelebRatePlan(ratePlan);

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCeleb ? "border-brand bg-brand-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* 상단: 객실명 + 셀럽 할인 배지 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">
          {ratePlan.roomTypeName}
        </h4>
        {isCeleb && <DiscountBadge percent={ratePlan.discountRate} />}
      </div>

      {/* 가격 영역 */}
      <div className="mt-2 flex items-baseline gap-2">
        {isCeleb ? (
          <>
            {/* 할인 적용 가격 강조 */}
            <span className="text-lg font-bold text-brand">
              {formatPrice(ratePlan.discountedPrice)}
            </span>
            {/* 원가 취소선 */}
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(ratePlan.pricePerNight)}
            </span>
          </>
        ) : (
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(ratePlan.pricePerNight)}
          </span>
        )}
        <span className="text-xs text-gray-500">/ 1박</span>
      </div>

      {/* 수용 인원 · 포함 서비스 */}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <span>{formatOccupancy(ratePlan.maxOccupancy)}</span>
        {ratePlan.includedServices.length > 0 && (
          <>
            <span>·</span>
            <span>{formatServices(ratePlan.includedServices)}</span>
          </>
        )}
      </div>

      {/* 취소 정책 */}
      <p className="mt-2 text-[11px] text-gray-400">
        {ratePlan.cancellationPolicy}
      </p>
    </div>
  );
}
