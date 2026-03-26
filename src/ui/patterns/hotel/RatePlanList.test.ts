import { describe, it, expect } from "vitest";
import { determineListState } from "./RatePlanList";
import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";

// ─── 테스트용 요금제 데이터 ─────────────────────────────────────────────────

const sampleRatePlan: RatePlan = {
  id: "rp-1",
  roomTypeName: "디럭스 더블",
  pricePerNight: 150000,
  maxOccupancy: 2,
  includedServices: ["조식"],
  cancellationPolicy: "3일 전 무료 취소",
};

const sampleCelebRatePlan: CelebRatePlan = {
  id: "crp-1",
  roomTypeName: "디럭스 트윈",
  pricePerNight: 200000,
  maxOccupancy: 3,
  includedServices: ["조식", "스파"],
  cancellationPolicy: "환불 불가",
  celebId: "celeb-1",
  discountRate: 20,
  discountedPrice: 160000,
};

// ─── determineListState 테스트 ──────────────────────────────────────────────

describe("determineListState", () => {
  it("isLoading이 true이면 'loading'을 반환한다", () => {
    const result = determineListState(true, null, []);
    expect(result).toBe("loading");
  });

  it("isLoading이 true이면 요금제가 있어도 'loading'을 반환한다", () => {
    const result = determineListState(true, null, [sampleRatePlan]);
    expect(result).toBe("loading");
  });

  it("error가 존재하면 'error'를 반환한다", () => {
    const error = new Error("네트워크 오류");
    const result = determineListState(false, error, []);
    expect(result).toBe("error");
  });

  it("로딩이 아니고 에러 없이 빈 배열이면 'empty'를 반환한다", () => {
    const result = determineListState(false, null, []);
    expect(result).toBe("empty");
  });

  it("로딩이 아니고 에러 없이 요금제가 있으면 'normal'을 반환한다", () => {
    const result = determineListState(false, null, [sampleRatePlan]);
    expect(result).toBe("normal");
  });

  it("셀럽 전용 요금제만 있어도 'normal'을 반환한다", () => {
    const result = determineListState(false, null, [sampleCelebRatePlan]);
    expect(result).toBe("normal");
  });

  it("일반 + 셀럽 전용 혼합 배열도 'normal'을 반환한다", () => {
    const result = determineListState(false, null, [
      sampleRatePlan,
      sampleCelebRatePlan,
    ]);
    expect(result).toBe("normal");
  });

  it("isLoading이 error보다 우선한다", () => {
    const error = new Error("오류");
    const result = determineListState(true, error, []);
    expect(result).toBe("loading");
  });

  it("error가 empty보다 우선한다", () => {
    const error = new Error("서버 오류");
    const result = determineListState(false, error, []);
    expect(result).toBe("error");
  });

  it("error가 undefined이면 에러 상태가 아니다", () => {
    const result = determineListState(false, undefined, [sampleRatePlan]);
    expect(result).toBe("normal");
  });
});
