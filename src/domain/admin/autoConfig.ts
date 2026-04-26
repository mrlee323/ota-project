import { z } from "zod";

// ─── Zod 스키마 정의 ────────────────────────────────────────────────────────

/** 생성 주기 타입 */
export const intervalTypeSchema = z.enum(["day", "week", "month"]);
export type IntervalType = z.infer<typeof intervalTypeSchema>;

/** 자동 생성 설정 스키마 */
export const autoConfigSchema = z.object({
  /** 자동 생성 활성화 여부 */
  enabled: z.boolean(),
  /** 생성 주기 타입 (day/week/month) */
  intervalType: intervalTypeSchema,
  /** 생성 주기 값 (양의 정수) */
  intervalValue: z.number().int().positive(),
  /** 다음 자동 생성 예정일 (ISO 8601) */
  nextGenerationDate: z.string().datetime(),
  /** AI가 추출한 추천 도시 목록 (관리자가 수정 가능) */
  suggestedCities: z.array(z.string().min(1)),
  /** 자동 생성 컨텐츠 노출 시작일 (ISO 8601) */
  contentStartDate: z.string().datetime(),
  /** 자동 생성 컨텐츠 노출 종료일 (ISO 8601) */
  contentEndDate: z.string().datetime(),
});
export type AutoConfig = z.infer<typeof autoConfigSchema>;

/** 자동 생성 설정 부분 업데이트 스키마 */
export const updateAutoConfigInputSchema = autoConfigSchema.partial();
export type UpdateAutoConfigInput = z.infer<typeof updateAutoConfigInputSchema>;

// ─── 순수 함수 ──────────────────────────────────────────────────────────────

/** intervalType에 따른 디폴트 노출 시작일 계산 */
export function getDefaultContentStartDate(
  generationDate: Date,
  intervalType: IntervalType,
): Date {
  switch (intervalType) {
    case "day": {
      // 생성일 다음날 08:00
      const d = new Date(generationDate);
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    }
    case "week": {
      // 생성일 다음주 월요일 08:00
      const d = new Date(generationDate);
      const dayOfWeek = d.getDay(); // 0=일, 1=월, ...
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(8, 0, 0, 0);
      return d;
    }
    case "month": {
      // 생성일 다음달 1일 08:00
      const d = new Date(generationDate);
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(8, 0, 0, 0);
      return d;
    }
  }
}

/** intervalType에 따른 디폴트 노출 종료일 계산 (시작일 + 주기) */
export function getDefaultContentEndDate(
  startDate: Date,
  intervalType: IntervalType,
  intervalValue: number,
): Date {
  const d = new Date(startDate);
  switch (intervalType) {
    case "day":
      d.setDate(d.getDate() + intervalValue - 1);
      break;
    case "week":
      d.setDate(d.getDate() + intervalValue * 7 - 1);
      break;
    case "month":
      d.setMonth(d.getMonth() + intervalValue);
      d.setDate(d.getDate() - 1);
      break;
  }
  d.setHours(23, 59, 59, 0);
  return d;
}
