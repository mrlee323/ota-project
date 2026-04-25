import { useQuery } from "@tanstack/react-query";
import { fetchHotelDetail } from "@/infrastructure/hotel/api";

/** 호텔 상세 조회 hook — 호텔 ID로만 조회, 검색 파라미터 변경 시 리패치하지 않는다 */
export function useHotelDetail(id: string) {
  return useQuery({
    queryKey: ["hotel", "detail", id],
    queryFn: () => fetchHotelDetail(id),
    enabled: !!id,
  });
}
