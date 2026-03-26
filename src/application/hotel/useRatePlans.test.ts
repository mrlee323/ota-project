import { describe, it, expect } from "vitest";
import { mergeAndSortRatePlans } from "./useRatePlans";
import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";
import { isCelebRatePlan } from "@/domain/hotel/ratePlan";

// ─── 테스트용 헬퍼 ─────────────────────────────────────────────────────────

/** 일반 요금제 생성 헬퍼 */
function makeRatePlan(overrides: Partial<RatePlan> = {}): RatePlan {
  return {
    id: "rp-1",
    roomTypeName: "스탠다드",
    pricePerNight: 100_000,
    maxOccupancy: 2,
    includedServices: ["조식"],
    cancellationPolicy: "무료 취소",
    ...overrides,
  };
}

/** 셀럽 전용 요금제 생성 헬퍼 */
function makeCelebRatePlan(
  overrides: Partial<CelebRatePlan> = {},
): CelebRatePlan {
  return {
    id: "crp-1",
    roomTypeName: "디럭스",
    pricePerNight: 200_000,
    maxOccupancy: 2,
    includedServices: ["조식", "스파"],
    cancellationPolicy: "무료 취소",
    celebId: "celeb-1",
    discountRate: 20,
    discountedPrice: 160_000,
    ...overrides,
  };
}

// ─── mergeAndSortRatePlans 테스트 ───────────────────────────────────────────

describe("mergeAndSortRatePlans", () => {
  it("일반 요금제만 있을 때 그대로 반환한다", () => {
    const plans = [makeRatePlan({ id: "rp-1" }), makeRatePlan({ id: "rp-2" })];

    const result = mergeAndSortRatePlans(plans, []);

    expect(result).toHaveLength(2);
    result.forEach((plan) => {
      expect(isCelebRatePlan(plan)).toBe(false);
    });
  });

  it("셀럽 전용 요금제만 있을 때 그대로 반환한다", () => {
    const celebPlans = [
      makeCelebRatePlan({ id: "crp-1" }),
      makeCelebRatePlan({ id: "crp-2" }),
    ];

    const result = mergeAndSortRatePlans([], celebPlans);

    expect(result).toHaveLength(2);
    result.forEach((plan) => {
      expect(isCelebRatePlan(plan)).toBe(true);
    });
  });

  it("셀럽 전용 요금제가 일반 요금제보다 상단에 배치된다", () => {
    const plans = [makeRatePlan({ id: "rp-1" }), makeRatePlan({ id: "rp-2" })];
    const celebPlans = [makeCelebRatePlan({ id: "crp-1" })];

    const result = mergeAndSortRatePlans(plans, celebPlans);

    expect(result).toHaveLength(3);
    // 첫 번째는 셀럽 전용
    expect(isCelebRatePlan(result[0])).toBe(true);
    expect(result[0].id).toBe("crp-1");
    // 나머지는 일반
    expect(isCelebRatePlan(result[1])).toBe(false);
    expect(isCelebRatePlan(result[2])).toBe(false);
  });

  it("빈 배열 두 개를 병합하면 빈 배열을 반환한다", () => {
    const result = mergeAndSortRatePlans([], []);
    expect(result).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const plans = [makeRatePlan({ id: "rp-1" })];
    const celebPlans = [makeCelebRatePlan({ id: "crp-1" })];
    const plansCopy = [...plans];
    const celebPlansCopy = [...celebPlans];

    mergeAndSortRatePlans(plans, celebPlans);

    expect(plans).toEqual(plansCopy);
    expect(celebPlans).toEqual(celebPlansCopy);
  });

  it("여러 셀럽 전용 요금제가 모두 일반 요금제보다 앞에 위치한다", () => {
    const plans = [makeRatePlan({ id: "rp-1" })];
    const celebPlans = [
      makeCelebRatePlan({ id: "crp-1" }),
      makeCelebRatePlan({ id: "crp-2" }),
      makeCelebRatePlan({ id: "crp-3" }),
    ];

    const result = mergeAndSortRatePlans(plans, celebPlans);

    expect(result).toHaveLength(4);

    // 셀럽 전용이 끝나는 인덱스를 찾는다
    const firstNonCelebIdx = result.findIndex((p) => !isCelebRatePlan(p));
    const celebCount = celebPlans.length;

    // 셀럽 전용 요금제가 모두 앞쪽에 위치
    expect(firstNonCelebIdx).toBe(celebCount);
  });

  it("병합 결과의 총 개수는 입력 배열 합산과 동일하다", () => {
    const plans = [
      makeRatePlan({ id: "rp-1" }),
      makeRatePlan({ id: "rp-2" }),
      makeRatePlan({ id: "rp-3" }),
    ];
    const celebPlans = [
      makeCelebRatePlan({ id: "crp-1" }),
      makeCelebRatePlan({ id: "crp-2" }),
    ];

    const result = mergeAndSortRatePlans(plans, celebPlans);

    expect(result).toHaveLength(plans.length + celebPlans.length);
  });

  it("서로 다른 셀럽 ID의 전용 요금제도 모두 상단에 배치된다", () => {
    const plans = [makeRatePlan({ id: "rp-1" })];
    const celebPlans = [
      makeCelebRatePlan({ id: "crp-1", celebId: "celeb-1" }),
      makeCelebRatePlan({ id: "crp-2", celebId: "celeb-2" }),
    ];

    const result = mergeAndSortRatePlans(plans, celebPlans);

    // 셀럽 전용 2개가 앞에, 일반 1개가 뒤에
    expect(isCelebRatePlan(result[0])).toBe(true);
    expect(isCelebRatePlan(result[1])).toBe(true);
    expect(isCelebRatePlan(result[2])).toBe(false);
  });

  it("모든 요금제의 필드가 병합 후에도 보존된다", () => {
    const plan = makeRatePlan({
      id: "rp-special",
      roomTypeName: "프리미엄 스위트",
      pricePerNight: 500_000,
      maxOccupancy: 4,
      includedServices: ["조식", "석식", "미니바"],
      cancellationPolicy: "3일 전 무료 취소",
    });
    const celebPlan = makeCelebRatePlan({
      id: "crp-special",
      celebId: "celeb-99",
      discountRate: 30,
      discountedPrice: 140_000,
    });

    const result = mergeAndSortRatePlans([plan], [celebPlan]);

    // 셀럽 전용 요금제 필드 보존 확인
    const foundCeleb = result.find((p) => p.id === "crp-special");
    expect(foundCeleb).toBeDefined();
    expect((foundCeleb as CelebRatePlan).celebId).toBe("celeb-99");
    expect((foundCeleb as CelebRatePlan).discountRate).toBe(30);

    // 일반 요금제 필드 보존 확인
    const foundPlan = result.find((p) => p.id === "rp-special");
    expect(foundPlan).toBeDefined();
    expect(foundPlan!.roomTypeName).toBe("프리미엄 스위트");
    expect(foundPlan!.pricePerNight).toBe(500_000);
    expect(foundPlan!.maxOccupancy).toBe(4);
    expect(foundPlan!.includedServices).toEqual(["조식", "석식", "미니바"]);
  });
});
