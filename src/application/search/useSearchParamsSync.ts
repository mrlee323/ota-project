"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { searchParamsAtom } from "./atoms";
import { parseSearchParams, serializeSearchParams } from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import { createSearchPersistenceAdapter } from "@/infrastructure/search/searchPersistence";
import type { SearchParams, RawSearchParams } from "@/domain/search/types";

/** 초기화 결과 타입 */
export interface SearchParamsInitResult {
  /** 결정된 검색 파라미터 */
  params: SearchParams;
  /** 영속화 저장소에 저장해야 하는지 여부 */
  shouldPersist: boolean;
  /** URL을 갱신해야 하는지 여부 */
  shouldUpdateUrl: boolean;
  /** 결정 소스 */
  source: "persistence" | "url" | "defaults";
}

/**
 * 영속화 저장소, URL 파라미터, 기본값을 기반으로 초기 검색 파라미터를 결정하는 순수 함수
 *
 * 우선순위: 영속화 저장소 > URL 쿼리 파라미터 > 기본값
 *
 * @param persisted - 영속화 저장소에서 로드한 값 (null이면 없음)
 * @param rawFromUrl - URL 쿼리 파라미터에서 추출한 원시 값
 * @param now - 기본값 생성 시 사용할 현재 시각 (테스트용)
 */
export function resolveInitialSearchParams(
  persisted: SearchParams | null,
  rawFromUrl: RawSearchParams,
  now?: Date,
): SearchParamsInitResult {
  // 1단계: 영속화 저장소에서 복원
  if (persisted) {
    return {
      params: persisted,
      shouldPersist: false,
      shouldUpdateUrl: true,
      source: "persistence",
    };
  }

  // 2단계: URL 쿼리 파라미터에서 파싱
  const parsed = parseSearchParams(rawFromUrl, now);
  if (parsed) {
    return {
      params: parsed,
      shouldPersist: true,
      shouldUpdateUrl: false,
      source: "url",
    };
  }

  // 3단계: 기본값 생성
  const defaults = createDefaultSearchParams(now);
  return {
    params: defaults,
    shouldPersist: true,
    shouldUpdateUrl: true,
    source: "defaults",
  };
}

/**
 * 검색 파라미터를 영속화 저장소(세션 스토리지 + 쿠키)와 URL 쿼리 파라미터에 동기화하는 훅
 *
 * 동작 흐름:
 * 1. 마운트 시 searchPersistence.load()로 저장된 값 복원 (세션 스토리지 우선 → 쿠키 폴백)
 * 2. 영속화 저장소에 값이 없으면 URL 쿼리 파라미터에서 파싱 시도
 * 3. 둘 다 없으면 기본값 생성
 * 4. 파라미터 변경 시 영속화 저장소와 URL을 동시에 업데이트
 */
export function useSearchParamsSync(): {
  searchParams: SearchParams | null;
  updateSearchParams: (params: Partial<SearchParams>) => void;
} {
  const urlSearchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useAtom(searchParamsAtom);
  const persistenceRef = useRef(createSearchPersistenceAdapter());

  useEffect(() => {
    const persistence = persistenceRef.current;

    // 영속화 저장소에서 로드
    const persisted = persistence.load();

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

    // 순수 함수로 초기 파라미터 결정
    const result = resolveInitialSearchParams(persisted, raw);

    // atom에 저장
    setSearchParams(result.params);

    // 영속화 저장소에 저장 (URL이나 기본값에서 온 경우)
    if (result.shouldPersist) {
      persistence.save(result.params);
    }

    // URL 동기화 (영속화 저장소나 기본값에서 온 경우)
    if (result.shouldUpdateUrl) {
      const queryString = serializeSearchParams(result.params);
      router.replace(`${pathname}?${queryString}`);
    }
  }, [urlSearchParams, router, pathname, setSearchParams]);

  /** 검색 파라미터를 부분 업데이트하고 영속화 저장소 + URL을 갱신한다 */
  const updateSearchParams = useCallback(
    (params: Partial<SearchParams>) => {
      const current = searchParams ?? createDefaultSearchParams();
      const updated: SearchParams = { ...current, ...params };
      setSearchParams(updated);

      // 영속화 저장소에 저장 (세션 스토리지 + 쿠키 동시)
      persistenceRef.current.save(updated);

      // URL 쿼리 파라미터도 동기화
      const queryString = serializeSearchParams(updated);
      router.replace(`${pathname}?${queryString}`);
    },
    [searchParams, setSearchParams, router, pathname],
  );

  return { searchParams, updateSearchParams };
}
