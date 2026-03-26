import { describe, it, expect } from "vitest";
import { celebIdSchema, determineCampaignStatus, isCampaignActive } from "./validation";
import type { GroupBuyCampaign } from "./types";

// ─── celebIdSchema ──────────────────────────────────────────────────────────

describe("celebIdSchema", () => {
  it("유효한 셀럽 ID를 파싱한다", () => {
    const result = celebIdSchema.safeParse("celeb-001");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("celeb-001");
    }
  });

  it("앞뒤 공백을 제거한다", () => {
    const result = celebIdSchema.safeParse("  celeb-001  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("celeb-001");
    }
  });

  it("빈 문자열은 거부한다", () => {
    const result = celebIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("공백만 있는 문자열은 거부한다", () => {
    const result = celebIdSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("숫자가 아닌 문자열도 허용한다", () => {
    const result = celebIdSchema.safeParse("abc-xyz");
    expect(result.success).toBe(true);
  });
});

// ─── determineCampaignStatus ────────────────────────────────────────────────

describe("determineCampaignStatus", () => {
  const startDate = "2025-07-01T00:00:00Z";
  const endDate = "2025-07-31T23:59:59Z";

  it("현재 시각이 시작일 이전이면 UPCOMING을 반환한다", () => {
    const now = new Date("2025-06-15T00:00:00Z");
    expect(determineCampaignStatus(startDate, endDate, now)).toBe("UPCOMING");
  });

  it("현재 시각이 시작일과 같으면 ACTIVE를 반환한다", () => {
    const now = new Date("2025-07-01T00:00:00Z");
    expect(determineCampaignStatus(startDate, endDate, now)).toBe("ACTIVE");
  });

  it("현재 시각이 시작일과 종료일 사이이면 ACTIVE를 반환한다", () => {
    const now = new Date("2025-07-15T12:00:00Z");
    expect(determineCampaignStatus(startDate, endDate, now)).toBe("ACTIVE");
  });

  it("현재 시각이 종료일과 같으면 ACTIVE를 반환한다", () => {
    const now = new Date("2025-07-31T23:59:59Z");
    expect(determineCampaignStatus(startDate, endDate, now)).toBe("ACTIVE");
  });

  it("현재 시각이 종료일 이후이면 ENDED를 반환한다", () => {
    const now = new Date("2025-08-01T00:00:00Z");
    expect(determineCampaignStatus(startDate, endDate, now)).toBe("ENDED");
  });

  it("시작일과 종료일이 같은 경우 해당 시각에 ACTIVE를 반환한다", () => {
    const sameDate = "2025-07-15T12:00:00Z";
    const now = new Date("2025-07-15T12:00:00Z");
    expect(determineCampaignStatus(sameDate, sameDate, now)).toBe("ACTIVE");
  });
});

// ─── isCampaignActive ───────────────────────────────────────────────────────

describe("isCampaignActive", () => {
  const campaign: GroupBuyCampaign = {
    id: "campaign-001",
    celebId: "celeb-001",
    hotelId: "hotel-001",
    startDate: "2025-07-01T00:00:00Z",
    endDate: "2025-07-31T23:59:59Z",
    status: "ACTIVE",
  };

  it("캠페인 기간 내이면 true를 반환한다", () => {
    const now = new Date("2025-07-15T12:00:00Z");
    expect(isCampaignActive(campaign, now)).toBe(true);
  });

  it("캠페인 시작 전이면 false를 반환한다", () => {
    const now = new Date("2025-06-15T00:00:00Z");
    expect(isCampaignActive(campaign, now)).toBe(false);
  });

  it("캠페인 종료 후이면 false를 반환한다", () => {
    const now = new Date("2025-08-01T00:00:00Z");
    expect(isCampaignActive(campaign, now)).toBe(false);
  });

  it("캠페인 시작일 정확히에 true를 반환한다", () => {
    const now = new Date("2025-07-01T00:00:00Z");
    expect(isCampaignActive(campaign, now)).toBe(true);
  });
});
