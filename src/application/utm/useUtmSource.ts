import { useAtomValue } from "jotai";
import { utmSourceAtom, utmInitializedAtom } from "./atoms";
import { DEFAULT_UTM_SOURCE } from "@/domain/utm/types";
import type { UtmEntry } from "@/domain/utm/types";

/** UTM 소스 상태와 초기화 여부를 반환하는 훅 */
export function useUtmSource(): {
  entry: UtmEntry | null;
  source: string;
  initialized: boolean;
} {
  const entry = useAtomValue(utmSourceAtom);
  const initialized = useAtomValue(utmInitializedAtom);

  return {
    entry,
    /** 서버 전달용 — 항상 문자열 (entry가 없으면 기본값) */
    source: entry?.source ?? DEFAULT_UTM_SOURCE,
    initialized,
  };
}
