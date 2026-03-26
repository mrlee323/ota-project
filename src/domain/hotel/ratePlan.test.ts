import { describe, it, expect } from "vitest";
import {
  ratePlanSchema,
  celebRatePlanSchema,
  isCelebRatePlan,
  sortRatePlans,
} from "./ratePlan";
import type { RatePlan, CelebRatePlan } from "./ratePlan";

// ─── 테스트용 유효 데이터 ───────────────────────────────────────────────────

const validRatePlan: RatePlan = {
  id: "rp-001",
  roomTypeName: "디럭스 더블",
  pricePerNight: 150000,
  maxOccupancy: 2,
  includedServices: ["조식", "수영장"],
  cancellationPolicy: "3일 전 무료 취소",
};

const validCelebRatePlan: CelebRatePlan = {
  id: "crp-001",
  roomTypeName: "디럭스 더블",
  pricePerNight: 150000,
  maxOccupancy: 2,
  includedServices: ["조식", "수영장", "스파"],
  cancellationPolicy: "3일 전 무료 취소",
  celebId: "celeb-001",
  discountRate: 20,
  discountedPrice: 120000,
};

// ─── ratePlanSchema ─────────────────────────────────────────────────────────

describe("ratePlanSchema", () => {
  it("유효한 요금제 데이터를 파싱한다", () => {
    const result = ratePlanSchema.safeParse(validRatePlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRatePlan);
    }
  });

  it("id가 빈 문자열이면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, id: "" });
    expect(result.success).toBe(false);
  });

  it("roomTypeName이 빈 문자열이면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, roomTypeName: "" });
    expect(result.success).toBe(false);
  });

  it("pricePerNight가 음수이면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, pricePerNight: -1 });
    expect(result.success).toBe(false);
  });

  it("pricePerNight가 0이면 성공한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, pricePerNight: 0 });
    expect(result.success).toBe(true);
  });

  it("maxOccupancy가 0이면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, maxOccupancy: 0 });
    expect(result.success).toBe(false);
  });

  it("maxOccupancy가 소수이면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, maxOccupancy: 2.5 });
    expect(result.success).toBe(false);
  });

  it("includedServices가 빈 배열이면 성공한다", () => {
    const result = ratePlanSchema.safeParse({ ...validRatePlan, includedServices: [] });
    expect(result.success).toBe(true);
  });

  it("필수 필드가 누락되면 실패한다", () => {
    const result = ratePlanSchema.safeParse({ id: "rp-001" });
    expect(result.success).toBe(false);
  });
});

// ─── celebRatePlanSchema ────────────────────────────────────────────────────

describe("celebRatePlanSchema", () => {
  it("유효한 셀럽 요금제 데이터를 파싱한다", () => {
    const result = celebRatePlanSchema.safeParse(validCelebRatePlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCelebRatePlan);
    }
  });

  it("celebId가 빈 문자열이면 실패한다", () => {
    const result = celebRatePlanSchema.safeParse({ ...validCelebRatePlan, celebId: "" });
    expect(result.success).toBe(false);
  });

  it("discountRate가 음수이면 실패한다", () => {
    const result = celebRatePlanSchema.safeParse({ ...validCelebRatePlan, discountRate: -1 });
    expect(result.success).toBe(false);
  });

  it("discountRate가 100 초과이면 실패한다", () => {
    const result = celebRatePlanSchema.safeParse({ ...validCelebRatePlan, discountRate: 101 });
    expect(result.success).toBe(false);
  });

  it("discountedPrice가 음수이면 실패한다", () => {
    const result = celebRatePlanSchema.safeParse({ ...validCelebRatePlan, discountedPrice: -1 });
    expect(result.success).toBe(false);
  });

  it("셀럽 전용 필드가 누락되면 실패한다", () => {
    const result = celebRatePlanSchema.safeParse(validRatePlan);
    expect(result.success).toBe(false);
  });
});

// ─── isCelebRatePlan ────────────────────────────────────────────────────────

describe("isCelebRatePlan", () => {
  it("셀럽 전용 요금제를 true로 판별한다", () => {
    expect(isCelebRatePlan(validCelebRatePlan)).toBe(true);
  });

  it("일반 요금제를 false로 판별한다", () => {
    expect(isCelebRatePlan(validRatePlan)).toBe(false);
  });
});

// ─── sortRatePlans ──────────────────────────────────────────────────────────

describe("sortRatePlans", () => {
  const regularA: RatePlan = { ...validRatePlan, id: "rp-a" };
  const regularB: RatePlan = { ...validRatePlan, id: "rp-b" };
  const celebA: CelebRatePlan = { ...validCelebRatePlan, id: "crp-a" };
  const celebB: CelebRatePlan = { ...validCelebRatePlan, id: "crp-b" };

  it("셀럽 전용 요금제를 일반 요금제보다 앞에 배치한다", () => {
    const mixed = [regularA, celebA, regularB, celebB];
    const sorted = sortRatePlans(mixed);

    // 앞쪽 2개는 셀럽, 뒤쪽 2개는 일반
    expect(isCelebRatePlan(sorted[0])).toBe(true);
    expect(isCelebRatePlan(sorted[1])).toBe(true);
    expect(isCelebRatePlan(sorted[2])).toBe(false);
    expect(isCelebRatePlan(sorted[3])).toBe(false);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = [regularA, celebA];
    const originalCopy = [...original];
    sortRatePlans(original);
    expect(original).toEqual(originalCopy);
  });

  it("빈 배열을 처리한다", () => {
    expect(sortRatePlans([])).toEqual([]);
  });

  it("셀럽 전용만 있는 배열을 처리한다", () => {
    const sorted = sortRatePlans([celebA, celebB]);
    expect(sorted).toHaveLength(2);
    expect(isCelebRatePlan(sorted[0])).toBe(true);
    expect(isCelebRatePlan(sorted[1])).toBe(true);
  });

  it("일반 요금제만 있는 배열을 처리한다", () => {
    const sorted = sortRatePlans([regularA, regularB]);
    expect(sorted).toHaveLength(2);
    expect(isCelebRatePlan(sorted[0])).toBe(false);
    expect(isCelebRatePlan(sorted[1])).toBe(false);
  });
});
