import { useQuery } from "@tanstack/react-query";
import { fetchRegionShowcase } from "@/infrastructure/hotel/showcaseApi";

/** 지역별 호텔 쇼케이스 데이터 조회 hook */
export function useRegionShowcase() {
  return useQuery({
    queryKey: ["hotel", "showcase"],
    queryFn: fetchRegionShowcase,
  });
}
