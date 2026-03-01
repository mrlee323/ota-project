import { z } from "zod";

/** UTM 소스 보존 기간 유형 */
export const RetentionPeriod = {
  SESSION: "SESSION",
  ONE_DAY: "1_DAY",
  SEVEN_DAYS: "7_DAYS",
  THIRTY_DAYS: "30_DAYS",
} as const;

export type RetentionPeriod =
  (typeof RetentionPeriod)[keyof typeof RetentionPeriod];

/** 보존 기간별 밀리초 매핑 (SESSION은 null — 브라우저 세션 종료 시 삭제) */
export const RETENTION_MS: Record<RetentionPeriod, number | null> = {
  SESSION: null,
  "1_DAY": 24 * 60 * 60 * 1000,
  "7_DAYS": 7 * 24 * 60 * 60 * 1000,
  "30_DAYS": 30 * 24 * 60 * 60 * 1000,
};

/** 저장소에 저장되는 UTM 엔트리 */
export interface UtmEntry {
  source: string;
  retentionType: RetentionPeriod;
  expiresAt: number | null; // 타임스탬프 (ms). SESSION이면 null
  createdAt: number; // 저장 시점 타임스탬프 (ms)
}

/** Zod 스키마: URL 파라미터 검증용 */
export const utmSourceParamSchema = z
  .string()
  .trim()
  .min(1, "utm_source는 빈 문자열일 수 없다")
  .transform((val) => val.toLowerCase());

/** Zod 스키마: 저장소 역직렬화 검증용 */
export const utmEntrySchema = z.object({
  source: z.string().min(1),
  retentionType: z.enum(["SESSION", "1_DAY", "7_DAYS", "30_DAYS"]),
  expiresAt: z.number().nullable(),
  createdAt: z.number(),
});
/** UTM 소스가 없을 때 서버에 전달할 기본값 */
export const DEFAULT_UTM_SOURCE = "direct" as const;
