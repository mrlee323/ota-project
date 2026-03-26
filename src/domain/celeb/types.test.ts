import { describe, it, expect } from "vitest";
import {
  celebSchema,
  campaignStatusSchema,
  groupBuyCampaignSchema,
  celebBannerItemSchema,
} from "./types";
import type { Celeb, GroupBuyCampaign, CelebBannerItem } from "./types";

// ─── 테스트용 유효 데이터 ───────────────────────────────────────────────────

const validCeleb: Celeb = {
  id: "celeb-001",
  name: "김셀럽",
  profileImageUrl: "https://example.com/profile.jpg",
  introduction: "여행 인플루언서입니다",
};

const validCampaign: GroupBuyCampaign = {
  id: "campaign-001",
  celebId: "celeb-001",
  hotelId: "hotel-001",
  startDate: "2025-07-01T00:00:00Z",
  endDate: "2025-07-31T23:59:59Z",
  status: "ACTIVE",
};

const validBannerItem: CelebBannerItem = {
  campaignId: "campaign-001",
  celeb: validCeleb,
  hotelId: "hotel-001",
  hotelName: "그랜드 호텔",
  discountRate: 15,
  bannerImageUrl: "https://example.com/banner.jpg",
};

// ─── celebSchema ────────────────────────────────────────────────────────────

describe("celebSchema", () => {
  it("유효한 셀럽 데이터를 파싱한다", () => {
    const result = celebSchema.safeParse(validCeleb);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCeleb);
    }
  });

  it("id가 빈 문자열이면 실패한다", () => {
    const result = celebSchema.safeParse({ ...validCeleb, id: "" });
    expect(result.success).toBe(false);
  });

  it("name이 빈 문자열이면 실패한다", () => {
    const result = celebSchema.safeParse({ ...validCeleb, name: "" });
    expect(result.success).toBe(false);
  });

  it("profileImageUrl이 유효하지 않은 URL이면 실패한다", () => {
    const result = celebSchema.safeParse({
      ...validCeleb,
      profileImageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("필수 필드가 누락되면 실패한다", () => {
    const result = celebSchema.safeParse({ id: "celeb-001" });
    expect(result.success).toBe(false);
  });

  it("introduction이 빈 문자열이어도 성공한다", () => {
    const result = celebSchema.safeParse({ ...validCeleb, introduction: "" });
    expect(result.success).toBe(true);
  });
});

// ─── campaignStatusSchema ───────────────────────────────────────────────────

describe("campaignStatusSchema", () => {
  it.each(["UPCOMING", "ACTIVE", "ENDED"] as const)(
    '"%s" 상태를 파싱한다',
    (status) => {
      const result = campaignStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    },
  );

  it("유효하지 않은 상태 값은 실패한다", () => {
    const result = campaignStatusSchema.safeParse("CANCELLED");
    expect(result.success).toBe(false);
  });
});

// ─── groupBuyCampaignSchema ─────────────────────────────────────────────────

describe("groupBuyCampaignSchema", () => {
  it("유효한 캠페인 데이터를 파싱한다", () => {
    const result = groupBuyCampaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCampaign);
    }
  });

  it("startDate가 ISO 8601 형식이 아니면 실패한다", () => {
    const result = groupBuyCampaignSchema.safeParse({
      ...validCampaign,
      startDate: "2025-07-01",
    });
    expect(result.success).toBe(false);
  });

  it("endDate가 ISO 8601 형식이 아니면 실패한다", () => {
    const result = groupBuyCampaignSchema.safeParse({
      ...validCampaign,
      endDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("status가 유효하지 않으면 실패한다", () => {
    const result = groupBuyCampaignSchema.safeParse({
      ...validCampaign,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("필수 필드가 누락되면 실패한다", () => {
    const result = groupBuyCampaignSchema.safeParse({
      id: "campaign-001",
    });
    expect(result.success).toBe(false);
  });
});

// ─── celebBannerItemSchema ──────────────────────────────────────────────────

describe("celebBannerItemSchema", () => {
  it("유효한 배너 데이터를 파싱한다", () => {
    const result = celebBannerItemSchema.safeParse(validBannerItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validBannerItem);
    }
  });

  it("discountRate가 0이면 성공한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      discountRate: 0,
    });
    expect(result.success).toBe(true);
  });

  it("discountRate가 100이면 성공한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      discountRate: 100,
    });
    expect(result.success).toBe(true);
  });

  it("discountRate가 음수이면 실패한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      discountRate: -1,
    });
    expect(result.success).toBe(false);
  });

  it("discountRate가 100 초과이면 실패한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      discountRate: 101,
    });
    expect(result.success).toBe(false);
  });

  it("bannerImageUrl이 유효하지 않은 URL이면 실패한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      bannerImageUrl: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("중첩된 celeb 객체가 유효하지 않으면 실패한다", () => {
    const result = celebBannerItemSchema.safeParse({
      ...validBannerItem,
      celeb: { id: "" },
    });
    expect(result.success).toBe(false);
  });
});
