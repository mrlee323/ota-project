import { z } from "zod";

// ─── Zod 스키마 정의 ────────────────────────────────────────────────────────

/** 셀럽(인플루언서) 정보 스키마 */
export const celebSchema = z.object({
  /** 셀럽 고유 ID */
  id: z.string().min(1),
  /** 셀럽 이름 */
  name: z.string().min(1),
  /** 프로필 이미지 URL */
  profileImageUrl: z.string().url(),
  /** 소개 문구 */
  introduction: z.string(),
});

/** 캠페인 상태 스키마 */
export const campaignStatusSchema = z.enum(["UPCOMING", "ACTIVE", "ENDED"]);

/** 공동구매 캠페인 스키마 */
export const groupBuyCampaignSchema = z.object({
  /** 캠페인 고유 ID */
  id: z.string().min(1),
  /** 연결된 셀럽 ID */
  celebId: z.string().min(1),
  /** 대상 호텔 ID */
  hotelId: z.string().min(1),
  /** 캠페인 시작일 (ISO 8601) */
  startDate: z.string().datetime(),
  /** 캠페인 종료일 (ISO 8601) */
  endDate: z.string().datetime(),
  /** 캠페인 상태 */
  status: campaignStatusSchema,
});

/** 메인 배너용 캠페인 요약 스키마 */
export const celebBannerItemSchema = z.object({
  /** 캠페인 ID */
  campaignId: z.string().min(1),
  /** 셀럽 정보 */
  celeb: celebSchema,
  /** 호텔 ID */
  hotelId: z.string().min(1),
  /** 호텔명 */
  hotelName: z.string().min(1),
  /** 할인율 (퍼센트) */
  discountRate: z.number().min(0).max(100),
  /** 배너 이미지 URL */
  bannerImageUrl: z.string().url(),
});

// ─── TypeScript 타입 (Zod 스키마에서 추론) ──────────────────────────────────

/** 셀럽(인플루언서) 정보 */
export type Celeb = z.infer<typeof celebSchema>;

/** 캠페인 상태 */
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

/** 공동구매 캠페인 */
export type GroupBuyCampaign = z.infer<typeof groupBuyCampaignSchema>;

/** 메인 배너용 캠페인 요약 (API 응답) */
export type CelebBannerItem = z.infer<typeof celebBannerItemSchema>;
