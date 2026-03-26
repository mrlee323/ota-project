import { atom } from "jotai";

/** 현재 세션의 셀럽 ID (공동구매 진입 시 설정) */
export const celebIdAtom = atom<string | null>(null);

/** 공동구매 초기화 완료 여부 */
export const celebInitializedAtom = atom<boolean>(false);
