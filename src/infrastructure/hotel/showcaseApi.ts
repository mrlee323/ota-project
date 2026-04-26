import {
  type RegionShowcaseData,
  regionShowcaseDataSchema,
} from "@/domain/hotel/showcaseTypes";
import { httpClient } from "@/infrastructure/http/client";

/**
 * 지역별 호텔 쇼케이스 데이터를 조회한다.
 * - httpClient로 API 호출 (네트워크 오류 시 자동 throw)
 * - Zod 스키마로 응답 데이터 검증 (검증 실패 시 ZodError throw)
 */
export async function fetchRegionShowcase(): Promise<RegionShowcaseData> {
  const json = await httpClient<unknown>("/api/hotel/showcase");
  return regionShowcaseDataSchema.parse(json);
}
