import { describe, it, expect } from "vitest";
import { fetchRatePlans, fetchCelebRatePlans } from "./ratePlanApi";
import { ratePlanSchema, celebRatePlanSchema, isCelebRatePlan } from "@/domain/hotel/ratePlan";
import { mockRatePlans, mockCelebRatePlans } from "@/__mocks__/ratePlan";

// ─── mock 데이터 유효성 검증 ────────────────────────────────────────────────

describe("ratePlan mock 데이터", () => {
  it("일반 요금제 mock 데이터가 최소 3개 이상이다", () => {
    expect(mockRatePlans.length).toBeGreaterThanOrEqual(3);
  });

  it("셀럽 전용 요금제 mock 데이터가 최소 2개 이상이다", () => {
    expect(mockCelebRatePlans.length).toBeGreaterThanOrEqual(2);
  });

  it("모든 일반 요금제가 Zod 스키마를 통과한다", () => {
    for (const plan of mockRatePlans) {
      const result = ratePlanSchema.safeParse(plan);
      expect(result.success).toBe(true);
    }
  });

  it("모든 셀럽 전용 요금제가 Zod 스키마를 통과한다", () => {
    for (const plan of mockCelebRatePlans) {
      const result = celebRatePlanSchema.safeParse(plan);
      expect(result.success).toBe(true);
    }
  });

  it("셀럽 전용 요금제의 discountedPrice가 올바르게 계산된다", () => {
    for (const plan of mockCelebRatePlans) {
      const expected = Math.round(plan.pricePerNight * (1 - plan.discountRate / 100));
      expect(plan.discountedPrice).toBe(expected);
    }
  });

  it("셀럽 전용 요금제가 celeb-1 또는 celeb-2에 연결되어 있다", () => {
    const validCelebIds = ["celeb-1", "celeb-2"];
    for (const plan of mockCelebRatePlans) {
      expect(validCelebIds).toContain(plan.celebId);
    }
  });
});

// ─── fetchRatePlans ─────────────────────────────────────────────────────────

describe("fetchRatePlans", () => {
  it("호텔 ID로 요금제 목록을 반환한다", async () => {
    const result = await fetchRatePlans("1");
    expect(result).toEqual(mockRatePlans);
    expect(result.length).toBeGreaterThan(0);
  });

  it("searchParams를 전달해도 정상 동작한다", async () => {
    const result = await fetchRatePlans("1", {
      checkInDate: "2025-07-01",
      checkOutDate: "2025-07-03",
      adultCount: 2,
      childrenAges: [],
    });
    expect(result).toEqual(mockRatePlans);
  });

  it("searchParams가 null이어도 정상 동작한다", async () => {
    const result = await fetchRatePlans("1", null);
    expect(result).toEqual(mockRatePlans);
  });

  it("반환된 요금제는 일반 요금제이다", async () => {
    const result = await fetchRatePlans("1");
    for (const plan of result) {
      expect(isCelebRatePlan(plan)).toBe(false);
    }
  });
});

// ─── fetchCelebRatePlans ────────────────────────────────────────────────────

describe("fetchCelebRatePlans", () => {
  it("셀럽 ID로 전용 요금제를 필터링하여 반환한다", async () => {
    const result = await fetchCelebRatePlans("1", "celeb-1");
    expect(result.length).toBeGreaterThan(0);
    for (const plan of result) {
      expect(plan.celebId).toBe("celeb-1");
    }
  });

  it("존재하지 않는 셀럽 ID는 빈 배열을 반환한다", async () => {
    const result = await fetchCelebRatePlans("1", "celeb-unknown");
    expect(result).toEqual([]);
  });

  it("반환된 요금제는 모두 셀럽 전용이다", async () => {
    const result = await fetchCelebRatePlans("1", "celeb-1");
    for (const plan of result) {
      expect(isCelebRatePlan(plan)).toBe(true);
    }
  });

  it("searchParams를 전달해도 정상 동작한다", async () => {
    const result = await fetchCelebRatePlans("1", "celeb-2", {
      checkInDate: "2025-07-01",
      checkOutDate: "2025-07-03",
      adultCount: 2,
      childrenAges: [],
    });
    expect(result.length).toBeGreaterThan(0);
    for (const plan of result) {
      expect(plan.celebId).toBe("celeb-2");
    }
  });
});
