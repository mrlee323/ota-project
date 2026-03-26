import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";
import type { SearchParams } from "@/domain/search/types";
import { mockRatePlans, mockCelebRatePlans } from "@/__mocks__/ratePlan";
// import { httpClient } from "@/infrastructure/http/client";

/**
 * 호텔 요금제 목록 조회
 * TODO: 실제 API 연동 시 httpClient로 교체하고 searchParams를 쿼리 파라미터로 전달
 */
export async function fetchRatePlans(
  hotelId: string,
  searchParams?: SearchParams | null,
): Promise<RatePlan[]> {
  // return httpClient<RatePlan[]>(`/api/hotel/${hotelId}/rate-plans`, { params: searchParams });

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockRatePlans;
}

/**
 * 셀럽 전용 요금제 조회
 * TODO: 실제 API 연동 시 httpClient로 교체하고 searchParams를 쿼리 파라미터로 전달
 */
export async function fetchCelebRatePlans(
  hotelId: string,
  celebId: string,
  searchParams?: SearchParams | null,
): Promise<CelebRatePlan[]> {
  // return httpClient<CelebRatePlan[]>(`/api/hotel/${hotelId}/celeb-rate-plans/${celebId}`, { params: searchParams });

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCelebRatePlans.filter((plan) => plan.celebId === celebId);
}
