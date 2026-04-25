import { atom } from "jotai";
import type { SearchParams } from "@/domain/search/types";
import { createDefaultSearchParams } from "@/domain/search/defaults";

/** 현재 검색 파라미터 상태를 관리하는 atom (childrenAges 포함) */
export const searchParamsAtom = atom<SearchParams>(createDefaultSearchParams());
