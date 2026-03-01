import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { utmSourceAtom, utmInitializedAtom } from "./atoms";
import { validateUtmSource, createUtmEntry } from "@/domain/utm/validation";
import { utmStorageService } from "@/infrastructure/utm/storage";
import { setUtmSourceHeader } from "@/infrastructure/utm/headerProvider";
import { DEFAULT_UTM_SOURCE } from "@/domain/utm/types";
import type { RetentionPeriod } from "@/domain/utm/types";

/** UTM 소스별 보존 기간 매핑 설정 */
const UTM_RETENTION_MAP: Record<string, RetentionPeriod> = {
  google: "30_DAYS",
  naver: "7_DAYS",
  facebook: "7_DAYS",
  instagram: "7_DAYS",
  // 기본값은 SESSION
};

/** 소스 이름으로 보존 기간을 결정한다 */
function getRetentionPeriod(source: string): RetentionPeriod {
  return UTM_RETENTION_MAP[source] ?? "SESSION";
}

/**
 * 페이지 로드 시 UTM 소스를 초기화하는 훅
 *
 * 읽기 우선순위:
 * 1. URL에 utm_source → 검증 후 이중 저장소에 저장, atom 갱신
 * 2. URL에 없음 → sessionStorage 조회 (탭 격리)
 * 3. sessionStorage 비어있음 → localStorage 조회 (브라우저 재시작 복원)
 * 4. 양쪽 모두 비어있음 → null
 */
export function useUtmInit(): void {
  const searchParams = useSearchParams();
  const setUtmSource = useSetAtom(utmSourceAtom);
  const setInitialized = useSetAtom(utmInitializedAtom);

  useEffect(() => {
    const rawUtmSource = searchParams.get("utm_source");
    const validatedSource = validateUtmSource(rawUtmSource);

    if (validatedSource !== null) {
      // URL에 유효한 utm_source가 있으면 새로 저장 (항상 양쪽 저장소에 저장)
      const retentionType = getRetentionPeriod(validatedSource);
      const entry = createUtmEntry(validatedSource, retentionType);
      utmStorageService.save(entry);
      setUtmSource(entry);
      setUtmSourceHeader(entry.source);
    } else {
      // URL에 utm_source가 없으면 저장소에서 복원 시도
      // load()가 sessionStorage → localStorage 순서로 조회
      const existingEntry = utmStorageService.load();
      setUtmSource(existingEntry);
      setUtmSourceHeader(existingEntry?.source ?? DEFAULT_UTM_SOURCE);
    }

    // 어떤 경우든 초기화 완료 표시
    setInitialized(true);
  }, [searchParams, setUtmSource, setInitialized]);
}
