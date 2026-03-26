import { z } from "zod";
import type { CampaignStatus, GroupBuyCampaign } from "./types";

/** 셀럽 ID 검증 스키마 — 빈 문자열 거부, 앞뒤 공백 제거 */
export const celebIdSchema = z
  .string()
  .trim()
  .min(1, "celeb_id는 빈 문자열일 수 없다");

/**
 * 캠페인 상태 판정: 현재 시각 기준으로 상태를 반환한다.
 * - now < startDate → "UPCOMING"
 * - startDate ≤ now ≤ endDate → "ACTIVE"
 * - now > endDate → "ENDED"
 */
export function determineCampaignStatus(
  startDate: string,
  endDate: string,
  now?: Date,
): CampaignStatus {
  const current = now ?? new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (current < start) return "UPCOMING";
  if (current > end) return "ENDED";
  return "ACTIVE";
}

/** 캠페인이 활성 상태인지 판정한다 */
export function isCampaignActive(
  campaign: GroupBuyCampaign,
  now?: Date,
): boolean {
  return (
    determineCampaignStatus(campaign.startDate, campaign.endDate, now) ===
    "ACTIVE"
  );
}
