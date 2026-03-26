import { useQuery } from "@tanstack/react-query";
import {
  fetchActiveCelebBanners,
  fetchCelebCampaign,
} from "@/infrastructure/celeb/api";

/** 특정 셀럽+호텔의 캠페인을 조회하는 훅 */
export function useCelebCampaign(celebId: string | null, hotelId: string) {
  return useQuery({
    queryKey: ["celeb", "campaign", celebId, hotelId],
    queryFn: () => fetchCelebCampaign(celebId!, hotelId),
    enabled: !!celebId && !!hotelId,
  });
}

/** 메인 배너용 활성 캠페인 목록을 조회하는 훅 */
export function useActiveCelebBanners() {
  return useQuery({
    queryKey: ["celeb", "banners", "active"],
    queryFn: fetchActiveCelebBanners,
  });
}
