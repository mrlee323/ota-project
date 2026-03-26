import { useQueries } from "@tanstack/react-query";
import {
  fetchRatePlans,
  fetchCelebRatePlans,
} from "@/infrastructure/hotel/ratePlanApi";
import { sortRatePlans } from "@/domain/hotel/ratePlan";
import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";
import type { SearchParams } from "@/domain/search/types";

/**
 * 일반 요금제와 셀럽 전용 요금제를 병합·정렬하는 순수 함수
 * — 셀럽 전용 요금제가 상단에 배치된다.
 */
export function mergeAndSortRatePlans(
  ratePlans: RatePlan[],
  celebRatePlans: CelebRatePlan[],
): (RatePlan | CelebRatePlan)[] {
  return sortRatePlans([...celebRatePlans, ...ratePlans]);
}

/**
 * 호텔 요금제 목록 조회 훅
 * — celebId가 있으면 셀럽 전용 요금제도 병렬 조회하여 병합·정렬한다.
 */
export function useRatePlans(
  hotelId: string,
  searchParams?: SearchParams | null,
  celebId?: string | null,
) {
  const hasCeleb = !!celebId;

  const results = useQueries({
    queries: [
      {
        queryKey: ["hotel", "ratePlans", hotelId, searchParams ?? null],
        queryFn: () => fetchRatePlans(hotelId, searchParams),
        enabled: !!hotelId,
      },
      {
        queryKey: [
          "hotel",
          "celebRatePlans",
          hotelId,
          celebId ?? null,
          searchParams ?? null,
        ],
        queryFn: () =>
          fetchCelebRatePlans(hotelId, celebId!, searchParams),
        enabled: !!hotelId && hasCeleb,
      },
    ],
  });

  const ratePlansQuery = results[0];
  const celebRatePlansQuery = results[1];

  // 일반 요금제 데이터
  const ratePlans: RatePlan[] = ratePlansQuery.data ?? [];

  // 셀럽 전용 요금제 데이터 (celebId 없으면 빈 배열)
  const celebRatePlans: CelebRatePlan[] = hasCeleb
    ? (celebRatePlansQuery.data ?? [])
    : [];

  // 병합 후 셀럽 전용 요금제를 상단에 배치
  const merged = mergeAndSortRatePlans(ratePlans, celebRatePlans);

  // 로딩 상태: celebId가 있으면 두 쿼리 모두 로딩 완료되어야 함
  const isLoading = hasCeleb
    ? ratePlansQuery.isLoading || celebRatePlansQuery.isLoading
    : ratePlansQuery.isLoading;

  // 에러: 둘 중 하나라도 에러면 에러 상태
  const error = ratePlansQuery.error ?? (hasCeleb ? celebRatePlansQuery.error : null);

  return {
    data: merged,
    isLoading,
    error,
  };
}
