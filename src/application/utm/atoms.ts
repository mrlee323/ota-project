import { atom } from "jotai";
import type { UtmEntry } from "@/domain/utm/types";

/** 현재 탭의 UTM 소스 상태를 관리하는 atom */
export const utmSourceAtom = atom<UtmEntry | null>(null);

/** UTM 초기화 완료 여부 — false면 아직 결정 전 */
export const utmInitializedAtom = atom<boolean>(false);
