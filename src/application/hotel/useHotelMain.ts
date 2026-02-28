import { useQuery } from "@tanstack/react-query";
import { fetchHotelMain } from "@/infrastructure/hotel/api";

/** 메인 페이지 호텔 데이터 조회 hook */
export function useHotelMain() {
  return useQuery({
    queryKey: ["hotel", "main"],
    queryFn: fetchHotelMain,
  });
}
