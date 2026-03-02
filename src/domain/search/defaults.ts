import { addDays, format } from "date-fns";
import type { SearchParams } from "./types";

/** 날짜를 YYYY-MM-DD 형식 문자열로 변환한다 */
const DATE_FORMAT = "yyyy-MM-dd";

/** 기본 검색 파라미터를 생성한다. now가 없으면 현재 시각을 사용한다 */
export function createDefaultSearchParams(now?: Date): SearchParams {
  const base = now ?? new Date();

  return {
    checkInDate: format(addDays(base, 7), DATE_FORMAT),
    checkOutDate: format(addDays(base, 8), DATE_FORMAT),
    adultCount: 2,
    childrenAges: [],
  };
}
