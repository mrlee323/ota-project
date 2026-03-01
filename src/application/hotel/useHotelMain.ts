import { useQuery } from "@tanstack/react-query";
import { fetchHotelMain } from "@/infrastructure/hotel/api";
import { useUtmSource } from "@/application/utm/useUtmSource";

/** 메인 페이지 호텔 데이터 조회 hook */
export function useHotelMain() {
  const { source, initialized } = useUtmSource();

  return useQuery({
    queryKey: ["hotel", "main", source],
    queryFn: fetchHotelMain,
    enabled: initialized,
  });
}
