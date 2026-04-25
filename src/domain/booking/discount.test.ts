import { describe, it, expect } from "vitest";
import { calculateDiscount } from "./discount";

describe("calculateDiscount", () => {
  it("프로모션만 적용한다", () => {
    const result = calculateDiscount({
      originalAmount: 100000,
      promotionDiscount: 20000,
      couponDiscount: 0,
    });

    expect(result.originalAmount).toBe(100000);
    expect(result.promotionDiscount).toBe(20000);
    expect(result.couponDiscount).toBe(0);
    expect(result.totalDiscount).toBe(20000);
    expect(result.finalAmount).toBe(80000);
  });

  it("쿠폰만 적용한다", () => {
    const result = calculateDiscount({
      originalAmount: 100000,
      promotionDiscount: 0,
      couponDiscount: 15000,
    });

    expect(result.originalAmount).toBe(100000);
    expect(result.promotionDiscount).toBe(0);
    expect(result.couponDiscount).toBe(15000);
    expect(result.totalDiscount).toBe(15000);
    expect(result.finalAmount).toBe(85000);
  });

  it("프로모션 → 쿠폰 순서로 적용한다", () => {
    const result = calculateDiscount({
      originalAmount: 100000,
      promotionDiscount: 30000,
      couponDiscount: 20000,
    });

    expect(result.promotionDiscount).toBe(30000);
    expect(result.couponDiscount).toBe(20000);
    expect(result.totalDiscount).toBe(50000);
    expect(result.finalAmount).toBe(50000);
  });

  it("할인 합계가 원래 금액을 초과하면 최종 금액 0원을 보장한다", () => {
    const result = calculateDiscount({
      originalAmount: 50000,
      promotionDiscount: 40000,
      couponDiscount: 30000,
    });

    expect(result.finalAmount).toBe(0);
    expect(result.promotionDiscount).toBe(40000);
    // 프로모션 적용 후 남은 10000원에서 쿠폰 30000원 적용 → 실제 쿠폰 할인은 10000원
    expect(result.couponDiscount).toBe(10000);
    expect(result.totalDiscount).toBe(50000);
  });

  it("프로모션이 원래 금액을 초과하면 실제 적용 금액만 반영한다", () => {
    const result = calculateDiscount({
      originalAmount: 30000,
      promotionDiscount: 50000,
      couponDiscount: 10000,
    });

    // 프로모션 50000 > 원래 30000 → 실제 프로모션 할인 30000, 남은 금액 0
    expect(result.promotionDiscount).toBe(30000);
    expect(result.couponDiscount).toBe(0);
    expect(result.totalDiscount).toBe(30000);
    expect(result.finalAmount).toBe(0);
  });

  it("할인 없이 원래 금액을 그대로 반환한다", () => {
    const result = calculateDiscount({
      originalAmount: 100000,
      promotionDiscount: 0,
      couponDiscount: 0,
    });

    expect(result.finalAmount).toBe(100000);
    expect(result.totalDiscount).toBe(0);
  });

  it("원래 금액이 0원이면 할인 적용 없이 0원을 반환한다", () => {
    const result = calculateDiscount({
      originalAmount: 0,
      promotionDiscount: 10000,
      couponDiscount: 5000,
    });

    expect(result.finalAmount).toBe(0);
    expect(result.promotionDiscount).toBe(0);
    expect(result.couponDiscount).toBe(0);
    expect(result.totalDiscount).toBe(0);
  });
});
