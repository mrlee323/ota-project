import type { ComponentType } from "react";
import { Hero } from "./modules/Hero";

/**
 * 모듈 컴포넌트 등록 — **변경 지점 2/2** (AC-2).
 *
 * 모듈을 추가할 때 고치는 곳은 `domain/md/modules/index.ts` 와 여기 두 곳뿐이다.
 * 3곳이 되면 설계가 샌 것이므로 되돌린다.
 *
 * 값의 모양은 모듈마다 달라 정적으로 좁힐 수 없다 — 검증은 validateBlock 이 한다 (D4).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 모듈마다 props 가 다르다. 타입 안전은 validateBlock 이 런타임에 책임진다
export const MODULE_REGISTRY: Record<string, ComponentType<any>> = {
  hero: Hero,
};
