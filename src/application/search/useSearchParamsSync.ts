"use client";

import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { searchParamsAtom } from "./atoms";
import { parseSearchParams, serializeSearchParams } from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import type { SearchParams, RawSearchParams } from "@/domain/search/types";

/**
 * URL 쿼리 파라미터를 파싱·검증하여 SearchParams를 제공하는 훅
 *
 * 동작 흐름:
 * 1. URL에서 쿼리 파라미터 읽기
 * 2. parseSearchParams로 파싱 및 검증
 * 3. 유효하면 atom에 저장, 유효하지 않으면 기본값 생성 후 URL 갱신
 * 4. SearchParams와 업데이트 함수 반환
 */
export function useSearchParamsSync(): {
  searchParams: SearchParams | null;
  updateSearchParams: (params: Partial<SearchParams>) => void;
} {
  const urlSearchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useAtom(searchParamsAtom);

  useEffect(() => {
    // URL에서 원시 파라미터 추출
    const raw: RawSearchParams = {};
    const checkInDate = urlSearchParams.get("checkInDate");
    const checkOutDate = urlSearchParams.get("checkOutDate");
    const adultCount = urlSearchParams.get("adultCount");
    const childrenAges = urlSearchParams.get("childrenAges");

    if (checkInDate) raw.checkInDate = checkInDate;
    if (checkOutDate) raw.checkOutDate = checkOutDate;
    if (adultCount) raw.adultCount = adultCount;
    if (childrenAges) raw.childrenAges = childrenAges;

    // 파싱 및 검증 시도
    const parsed = parseSearchParams(raw);

    if (parsed) {
      // 유효한 파라미터 → atom에 저장
      setSearchParams(parsed);
    } else {
      // 유효하지 않거나 파라미터 없음 → 기본값 생성 후 URL 갱신
      const defaults = createDefaultSearchParams();
      setSearchParams(defaults);
      const queryString = serializeSearchParams(defaults);
      router.replace(`${pathname}?${queryString}`);
    }
  }, [urlSearchParams, router, pathname, setSearchParams]);

  /** 검색 파라미터를 부분 업데이트하고 URL을 갱신한다 */
  const updateSearchParams = useCallback(
    (params: Partial<SearchParams>) => {
      const current = searchParams ?? createDefaultSearchParams();
      const updated: SearchParams = { ...current, ...params };
      setSearchParams(updated);
      const queryString = serializeSearchParams(updated);
      router.replace(`${pathname}?${queryString}`);
    },
    [searchParams, setSearchParams, router, pathname],
  );

  return { searchParams, updateSearchParams };
}
