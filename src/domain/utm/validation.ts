import {
  utmSourceParamSchema,
  utmEntrySchema,
  type UtmEntry,
  RETENTION_MS,
  type RetentionPeriod,
} from "./types";

/** URL 파라미터 값을 검증하고 정규화한다. 무효하면 null 반환 */
export function validateUtmSource(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const result = utmSourceParamSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** JSON 문자열을 UtmEntry로 파싱한다. 무효하면 null 반환 */
export function parseUtmEntry(json: string): UtmEntry | null {
  try {
    const parsed = JSON.parse(json);
    const result = utmEntrySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** UtmEntry를 JSON 문자열로 직렬화한다 */
export function serializeUtmEntry(entry: UtmEntry): string {
  return JSON.stringify(entry);
}

/** UTM_Entry가 만료되었는지 판정한다 */
export function isExpired(
  entry: UtmEntry,
  now: number = Date.now()
): boolean {
  if (entry.expiresAt === null) return false; // SESSION은 브라우저가 관리
  return now >= entry.expiresAt;
}

/** 보존 기간과 현재 시각으로 UtmEntry를 생성한다 */
export function createUtmEntry(
  source: string,
  retentionType: RetentionPeriod,
  now: number = Date.now()
): UtmEntry {
  const ttlMs = RETENTION_MS[retentionType];
  return {
    source,
    retentionType,
    expiresAt: ttlMs !== null ? now + ttlMs : null,
    createdAt: now,
  };
}
