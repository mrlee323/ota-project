/** 검색 파라미터 객체 (검증 완료된 상태) */
export interface SearchParams {
  /** 체크인 날짜 (YYYY-MM-DD 형식) */
  checkInDate: string;
  /** 체크아웃 날짜 (YYYY-MM-DD 형식) */
  checkOutDate: string;
  /** 성인 수 (1~10) */
  adultCount: number;
  /** 아동 나이 배열 (각 원소 0~17) */
  childrenAges: number[];
}

/** URL 쿼리 문자열에서 파싱된 원시 파라미터 (모든 필드 optional string) */
export interface RawSearchParams {
  checkInDate?: string;
  checkOutDate?: string;
  adultCount?: string;
  childrenAges?: string;
}
