import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";
import { RatePlanItem } from "./RatePlanItem";

// ─── 상태 판별 헬퍼 (테스트 가능하도록 export) ─────────────────────────────

/** 표시 상태 타입 */
export type RatePlanListState = "loading" | "error" | "empty" | "normal";

/** Props 기반으로 현재 표시 상태를 결정한다 */
export function determineListState(
  isLoading: boolean,
  error: Error | null | undefined,
  ratePlans: (RatePlan | CelebRatePlan)[],
): RatePlanListState {
  if (isLoading) return "loading";
  if (error) return "error";
  if (ratePlans.length === 0) return "empty";
  return "normal";
}

// ─── 스켈레톤 UI ────────────────────────────────────────────────────────────

/** 로딩 시 표시할 스켈레톤 카드 수 */
const SKELETON_COUNT = 3;

function RatePlanSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 p-4">
      {/* 객실명 */}
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      {/* 가격 */}
      <div className="mt-3 h-5 w-1/4 rounded bg-gray-200" />
      {/* 수용 인원 · 서비스 */}
      <div className="mt-3 h-3 w-2/3 rounded bg-gray-100" />
      {/* 취소 정책 */}
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
    </div>
  );
}

// ─── 컴포넌트 ───────────────────────────────────────────────────────────────

interface RatePlanListProps {
  /** 요금제 목록 (일반 + 셀럽 전용) */
  ratePlans: (RatePlan | CelebRatePlan)[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error?: Error | null;
  /** 호텔명 — RatePlanItem → BookButton으로 전달 */
  hotelName: string;
}

/** 요금제 리스트 — 로딩/빈 목록/에러/정상 상태를 조건부 렌더링 */
export function RatePlanList({ ratePlans, isLoading, error, hotelName }: RatePlanListProps) {
  const state = determineListState(isLoading, error, ratePlans);

  return (
    <section aria-label="요금제 목록">
      {state === "loading" && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <RatePlanSkeleton key={i} />
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            {error?.message ?? "요금제를 불러오는 중 오류가 발생했습니다"}
          </p>
        </div>
      )}

      {state === "empty" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            이용 가능한 요금제가 없습니다
          </p>
        </div>
      )}

      {state === "normal" && (
        <div className="flex flex-col gap-3">
          {ratePlans.map((plan) => (
            <RatePlanItem key={plan.id} ratePlan={plan} hotelName={hotelName} />
          ))}
        </div>
      )}
    </section>
  );
}
