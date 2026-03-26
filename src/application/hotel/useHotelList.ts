import { useQuery } from "@tanstack/react-query";
import { fetchHotelList } from "@/infrastructure/hotel/api";

/** 호텔 리스트 조회 hook */
export function useHotelList() {
  return useQuery({
    queryKey: ["hotel", "list"],
    queryFn: fetchHotelList,
  });
}
