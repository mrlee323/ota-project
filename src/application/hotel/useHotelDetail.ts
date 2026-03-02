import { useQuery } from "@tanstack/react-query";
import { fetchHotelDetail } from "@/infrastructure/hotel/api";
import type { SearchParams } from "@/domain/search/types";

/** 호텔 상세 조회 hook — 검색 파라미터 변경 시 자동 재조회 */
export function useHotelDetail(id: string, searchParams?: SearchParams | null) {
  return useQuery({
    queryKey: ["hotel", "detail", id, searchParams ?? null],
    queryFn: () => fetchHotelDetail(id, searchParams),
    enabled: !!id,
  });
}
