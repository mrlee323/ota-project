import { z } from "zod";
import type { SearchParams, RawSearchParams } from "./types";

/** YYYY-MM-DD 형식 정규식 */
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 오늘 날짜를 YYYY-MM-DD 문자열로 반환한다 */
function todayString(now?: Date): string {
  const d = now ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 검색 파라미터 Zod 스키마를 생성한다. now 파라미터로 테스트 시 시간 고정 가능 */
function createSearchParamsSchema(now?: Date) {
  return z
    .object({
      checkInDate: dateStringSchema,
      checkOutDate: dateStringSchema,
      adultCount: z.number().int().min(1).max(10),
      childrenAges: z.array(z.number().int().min(0).max(17)),
    })
    .refine((data) => data.checkOutDate > data.checkInDate, {
      message: "체크아웃 날짜는 체크인 날짜 이후여야 한다",
    })
    .refine((data) => data.checkInDate >= todayString(now), {
      message: "체크인 날짜는 오늘 이후여야 한다",
    });
}

/** 기본 검색 파라미터 스키마 (런타임 시점의 오늘 날짜 사용) */
export const searchParamsSchema = createSearchParamsSchema();

/** 원시 쿼리 파라미터를 SearchParams로 파싱한다. 실패 시 null 반환 */
export function parseSearchParams(
  raw: RawSearchParams,
  now?: Date,
): SearchParams | null {
  const candidate = {
    checkInDate: raw.checkInDate ?? "",
    checkOutDate: raw.checkOutDate ?? "",
    adultCount: raw.adultCount ? Number(raw.adultCount) : NaN,
    childrenAges: raw.childrenAges
      ? raw.childrenAges.split(",").map(Number)
      : [],
  };

  const schema = now ? createSearchParamsSchema(now) : searchParamsSchema;
  const result = schema.safeParse(candidate);
  return result.success ? result.data : null;
}

/** SearchParams를 URL 쿼리 문자열로 직렬화한다 */
export function serializeSearchParams(params: SearchParams): string {
  const entries: [string, string][] = [
    ["checkInDate", params.checkInDate],
    ["checkOutDate", params.checkOutDate],
    ["adultCount", String(params.adultCount)],
  ];

  // childrenAges가 빈 배열이면 쿼리 파라미터에서 생략한다
  if (params.childrenAges.length > 0) {
    entries.push(["childrenAges", params.childrenAges.join(",")]);
  }

  return new URLSearchParams(entries).toString();
}

/** URL 쿼리 문자열을 RawSearchParams로 변환한다 */
export function deserializeSearchParams(queryString: string): RawSearchParams {
  const params = new URLSearchParams(queryString);
  const raw: RawSearchParams = {};

  if (params.has("checkInDate")) raw.checkInDate = params.get("checkInDate")!;
  if (params.has("checkOutDate")) raw.checkOutDate = params.get("checkOutDate")!;
  if (params.has("adultCount")) raw.adultCount = params.get("adultCount")!;
  if (params.has("childrenAges")) raw.childrenAges = params.get("childrenAges")!;

  return raw;
}
