import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { celebIdAtom, celebInitializedAtom } from "./atoms";
import { celebIdSchema } from "@/domain/celeb/validation";

/** sessionStorage 키 */
export const CELEB_ID_STORAGE_KEY = "celeb_id";

/** 초기화 결과 타입 */
export interface GroupBuyInitResult {
  celebId: string | null;
  shouldStore: boolean; // sessionStorage에 저장해야 하는지 여부
}

/**
 * URL 파라미터와 sessionStorage 값을 기반으로 셀럽 ID를 결정하는 순수 함수
 *
 * 로직:
 * 1. utm_source=celeb && celeb_id 유효 → 해당 ID 반환 + 저장 필요
 * 2. utm_source=celeb && celeb_id 무효 → null 반환
 * 3. utm_source가 celeb이 아닌 경우 → storedCelebId에서 복원 시도
 */
export function resolveGroupBuyCelebId(
  utmSource: string | null,
  rawCelebId: string | null,
  storedCelebId: string | null,
): GroupBuyInitResult {
  if (utmSource === "celeb") {
    const result = celebIdSchema.safeParse(rawCelebId);
    if (result.success) {
      return { celebId: result.data, shouldStore: true };
    }
    return { celebId: null, shouldStore: false };
  }

  // utm_source가 celeb이 아닌 경우 → 저장소에서 복원 시도
  const result = celebIdSchema.safeParse(storedCelebId);
  if (result.success) {
    return { celebId: result.data, shouldStore: false };
  }
  return { celebId: null, shouldStore: false };
}

/**
 * 공동구매 진입을 초기화하는 훅
 *
 * 로직 흐름:
 * 1. URL에서 utm_source, celeb_id 파라미터 읽기
 * 2. utm_source=celeb && celeb_id 유효 → celebIdAtom 설정 + sessionStorage 저장
 * 3. utm_source=celeb && celeb_id 무효 → celebIdAtom null (일반 모드)
 * 4. utm_source가 celeb이 아닌 경우 → sessionStorage에서 복원 시도
 * 5. 항상 celebInitializedAtom을 true로 설정
 */
export function useGroupBuyInit(): void {
  const searchParams = useSearchParams();
  const setCelebId = useSetAtom(celebIdAtom);
  const setInitialized = useSetAtom(celebInitializedAtom);

  useEffect(() => {
    const utmSource = searchParams.get("utm_source");
    const rawCelebId = searchParams.get("celeb_id");

    // sessionStorage에서 기존 값 읽기
    let storedCelebId: string | null = null;
    try {
      storedCelebId = sessionStorage.getItem(CELEB_ID_STORAGE_KEY);
    } catch {
      // sessionStorage 접근 불가 시 무시 (SSR, 프라이빗 브라우징 등)
    }

    const { celebId, shouldStore } = resolveGroupBuyCelebId(
      utmSource,
      rawCelebId,
      storedCelebId,
    );

    setCelebId(celebId);

    // 유효한 셀럽 링크 진입 시 sessionStorage에 저장
    if (shouldStore && celebId !== null) {
      try {
        sessionStorage.setItem(CELEB_ID_STORAGE_KEY, celebId);
      } catch {
        // sessionStorage 접근 불가 시 무시
      }
    }

    // 어떤 경우든 초기화 완료 표시
    setInitialized(true);
  }, [searchParams, setCelebId, setInitialized]);
}
