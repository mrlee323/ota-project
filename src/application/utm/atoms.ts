import { atom } from "jotai";
import type { UtmEntry } from "@/domain/utm/types";

/** 현재 탭의 UTM 소스 상태를 관리하는 atom */
export const utmSourceAtom = atom<UtmEntry | null>(null);
