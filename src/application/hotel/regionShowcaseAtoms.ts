import { atom } from "jotai";

/** 선택된 지역 탭 인덱스 (기본값: 0, 첫 번째 탭 선택) */
export const selectedRegionIndexAtom = atom<number>(0);
