import { z } from "zod";
import { showcaseHotelCardSchema } from "@/domain/hotel/showcaseTypes";

// ─── Zod 스키마 정의 ────────────────────────────────────────────────────────

/** 쇼케이스 컨텐츠 기본 스키마 (refine 전) */
const showcaseContentBaseSchema = z.object({
  /** 고유 ID (UUID) */
  id: z.string().uuid(),
  /** 도시명 */
  cityName: z.string().min(1),
  /** 타이틀 */
  title: z.string().min(1),
  /** 대표 이미지 URL */
  imageUrl: z.string().url(),
  /** 호텔 카드 목록 */
  hotels: z.array(showcaseHotelCardSchema),
  /** 서비스 활성화 여부 */
  serviceEnabled: z.boolean(),
  /** 노출 시작일 (ISO 8601) */
  startDate: z.string().datetime(),
  /** 노출 종료일 (ISO 8601) */
  endDate: z.string().datetime(),
  /** 생성 일시 (ISO 8601) */
  createdAt: z.string().datetime(),
  /** 수정 일시 (ISO 8601) */
  updatedAt: z.string().datetime(),
});

/** 쇼케이스 컨텐츠 스키마 (startDate < endDate 검증 포함) */
export const showcaseContentSchema = showcaseContentBaseSchema.refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: "startDate는 endDate보다 이전이어야 합니다", path: ["startDate"] },
);
export type ShowcaseContent = z.infer<typeof showcaseContentBaseSchema>;

/** 생성 위저드 중간 상태 기본 스키마 */
const showcaseCreationDraftBaseSchema = z.object({
  /** 도시명 */
  cityName: z.string().min(1),
  /** 타이틀 */
  title: z.string().min(1),
  /** 대표 이미지 URL */
  imageUrl: z.string().url(),
  /** 호텔 카드 목록 */
  hotels: z.array(showcaseHotelCardSchema),
  /** 노출 시작일 (ISO 8601) */
  startDate: z.string().datetime(),
  /** 노출 종료일 (ISO 8601) */
  endDate: z.string().datetime(),
});

/** 생성 위저드 중간 상태 스키마 (startDate < endDate 검증 포함) */
export const showcaseCreationDraftSchema = showcaseCreationDraftBaseSchema.refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: "startDate는 endDate보다 이전이어야 합니다", path: ["startDate"] },
);
export type ShowcaseCreationDraft = z.infer<typeof showcaseCreationDraftBaseSchema>;

// ─── 순수 함수 ──────────────────────────────────────────────────────────────

/** 서비스 노출 가능 여부 판단 */
export function isShowcaseActive(
  content: ShowcaseContent,
  now: Date = new Date(),
): boolean {
  return (
    content.serviceEnabled &&
    new Date(content.startDate) <= now &&
    now <= new Date(content.endDate)
  );
}

/** 노출 기간 만료 여부 판단 */
export function isShowcaseExpired(
  content: ShowcaseContent,
  now: Date = new Date(),
): boolean {
  return new Date(content.endDate) < now;
}
