import { describe, it, expect } from "vitest";
import { formatPrice, formatOccupancy, formatServices } from "./RatePlanItem";

// ─── formatPrice 테스트 ─────────────────────────────────────────────────────

describe("formatPrice", () => {
  it("0원을 올바르게 포맷한다", () => {
    expect(formatPrice(0)).toBe("0원");
  });

  it("천 단위 구분자를 포함한다", () => {
    expect(formatPrice(150000)).toBe("150,000원");
  });

  it("백만 단위 가격을 올바르게 포맷한다", () => {
    expect(formatPrice(1200000)).toBe("1,200,000원");
  });

  it("구분자가 필요 없는 작은 금액을 처리한다", () => {
    expect(formatPrice(500)).toBe("500원");
  });
});

// ─── formatOccupancy 테스트 ─────────────────────────────────────────────────

describe("formatOccupancy", () => {
  it("최대 수용 인원 텍스트를 반환한다", () => {
    expect(formatOccupancy(2)).toBe("최대 2인");
  });

  it("1인 수용을 올바르게 표시한다", () => {
    expect(formatOccupancy(1)).toBe("최대 1인");
  });

  it("대규모 수용 인원을 처리한다", () => {
    expect(formatOccupancy(10)).toBe("최대 10인");
  });
});

// ─── formatServices 테스트 ──────────────────────────────────────────────────

describe("formatServices", () => {
  it("빈 배열이면 빈 문자열을 반환한다", () => {
    expect(formatServices([])).toBe("");
  });

  it("단일 서비스를 그대로 반환한다", () => {
    expect(formatServices(["조식"])).toBe("조식");
  });

  it("복수 서비스를 쉼표로 구분한다", () => {
    expect(formatServices(["조식", "수영장", "스파"])).toBe("조식, 수영장, 스파");
  });
});
