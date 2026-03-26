import type { Celeb, GroupBuyCampaign, CelebBannerItem } from "@/domain/celeb/types";
import { mockCelebs, mockCampaigns, mockCelebBanners } from "@/__mocks__/celeb";
// import { httpClient } from "@/infrastructure/http/client";

/**
 * 활성 공동구매 배너 목록 조회
 * TODO: 실제 API 연동 시 httpClient로 교체
 */
export async function fetchActiveCelebBanners(): Promise<CelebBannerItem[]> {
  // return httpClient<CelebBannerItem[]>("/api/celeb/banners/active");

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCelebBanners;
}

/**
 * 특정 셀럽+호텔의 캠페인 조회
 * TODO: 실제 API 연동 시 httpClient로 교체
 */
export async function fetchCelebCampaign(
  celebId: string,
  hotelId: string,
): Promise<GroupBuyCampaign | null> {
  // return httpClient<GroupBuyCampaign | null>(`/api/celeb/${celebId}/campaign`, { params: { hotelId } });

  await new Promise((resolve) => setTimeout(resolve, 300));
  const campaign = mockCampaigns.find(
    (c) => c.celebId === celebId && c.hotelId === hotelId,
  );
  return campaign ?? null;
}

/**
 * 셀럽 정보 조회
 * TODO: 실제 API 연동 시 httpClient로 교체
 */
export async function fetchCeleb(celebId: string): Promise<Celeb | null> {
  // return httpClient<Celeb | null>(`/api/celeb/${celebId}`);

  await new Promise((resolve) => setTimeout(resolve, 300));
  const celeb = mockCelebs.find((c) => c.id === celebId);
  return celeb ?? null;
}
