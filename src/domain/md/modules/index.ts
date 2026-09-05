import type { ModuleDef } from "../moduleDef";
import { hero } from "./hero";

/**
 * 모듈 정의 등록 — **변경 지점 1/2** (AC-2).
 *
 * 모듈을 추가할 때 고치는 곳은 여기와 `ui/patterns/md/registry.ts` 두 곳뿐이다.
 * 3곳이 되면 설계가 샌 것이므로 되돌린다.
 */
export const MODULE_DEFS: ModuleDef[] = [hero];

export const MODULE_BY_TYPE = new Map(MODULE_DEFS.map((d) => [d.type, d]));

export function findModuleDef(type: string): ModuleDef | undefined {
  return MODULE_BY_TYPE.get(type);
}
