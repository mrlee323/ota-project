import { atom } from "jotai";
import type { SearchParams } from "@/domain/search/types";

/** 현재 검색 파라미터 상태를 관리하는 atom */
export const searchParamsAtom = atom<SearchParams | null>(null);
