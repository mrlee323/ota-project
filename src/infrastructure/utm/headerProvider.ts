import { DEFAULT_UTM_SOURCE } from "@/domain/utm/types";
import { registerHeaderProvider } from "@/infrastructure/http/client";

/** 현재 UTM 소스 값 (모듈 스코프에서 관리) */
let currentUtmSource: string = DEFAULT_UTM_SOURCE;

/** UTM 소스 값을 갱신한다 (useUtmInit에서 호출) */
export function setUtmSourceHeader(source: string): void {
  currentUtmSource = source;
}

/** HTTP 클라이언트에 UTM 헤더 제공자를 등록한다 */
export function initUtmHeaderProvider(): void {
  registerHeaderProvider(() => ({
    "x-utm-source": currentUtmSource,
  }));
}
