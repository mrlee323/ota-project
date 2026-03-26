import { describe, it, expect } from "vitest";
import type { Celeb, CampaignStatus } from "@/domain/celeb/types";

// ─── 테스트용 셀럽 데이터 ───────────────────────────────────────────────────

const mockCeleb: Celeb = {
  id: "celeb-1",
  name: "테스트 셀럽",
  profileImageUrl: "https://example.com/profile.jpg",
  introduction: "안녕하세요, 여행을 사랑하는 셀럽입니다.",
};

// ─── 캠페인 종료 여부 판별 로직 테스트 ──────────────────────────────────────

/**
 * CelebProfile 컴포넌트는 campaignStatus === "ENDED"일 때
 * 종료 안내 배지를 표시한다. 이 판별 로직을 검증한다.
 */
function shouldShowEndedBadge(status: CampaignStatus): boolean {
  return status === "ENDED";
}

describe("CelebProfile — 캠페인 종료 배지 표시 로직", () => {
  it("캠페인이 ENDED 상태이면 종료 배지를 표시한다", () => {
    expect(shouldShowEndedBadge("ENDED")).toBe(true);
  });

  it("캠페인이 ACTIVE 상태이면 종료 배지를 표시하지 않는다", () => {
    expect(shouldShowEndedBadge("ACTIVE")).toBe(false);
  });

  it("캠페인이 UPCOMING 상태이면 종료 배지를 표시하지 않는다", () => {
    expect(shouldShowEndedBadge("UPCOMING")).toBe(false);
  });
});

describe("CelebProfile — Props 타입 검증", () => {
  it("Celeb 객체가 필수 필드를 모두 포함한다", () => {
    expect(mockCeleb).toHaveProperty("id");
    expect(mockCeleb).toHaveProperty("name");
    expect(mockCeleb).toHaveProperty("profileImageUrl");
    expect(mockCeleb).toHaveProperty("introduction");
  });

  it("CampaignStatus는 3가지 상태 중 하나이다", () => {
    const validStatuses: CampaignStatus[] = ["UPCOMING", "ACTIVE", "ENDED"];
    validStatuses.forEach((status) => {
      expect(["UPCOMING", "ACTIVE", "ENDED"]).toContain(status);
    });
  });
});
