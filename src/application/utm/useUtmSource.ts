import { useAtomValue } from "jotai";
import { utmSourceAtom } from "./atoms";
import type { UtmEntry } from "@/domain/utm/types";

/** 현재 탭의 UTM 소스 정보를 반환하는 훅 */
export function useUtmSource(): UtmEntry | null {
  return useAtomValue(utmSourceAtom);
}
