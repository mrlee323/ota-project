import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  paymentContextSchema,
  type PaymentContext,
  type PaymentEnvironment,
} from "./types";

/**
 * PaymentContext용 fast-check Arbitrary 생성기
 * - ISO 8601 datetime 형식의 checkIn/checkOut 생성
 * - 유효한 PaymentEnvironment 값만 생성
 */
const paymentEnvironmentArb: fc.Arbitrary<PaymentEnvironment> = fc.constantFrom(
  "PC" as const,
  "MOBILE" as const,
  "WEBVIEW" as const
);

// ISO 8601 datetime 문자열 생성기 (Zod의 z.string().datetime() 호환)
// 타임스탬프 기반으로 안전하게 생성
const isoDatetimeArb: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2020-01-01T00:00:00Z").getTime(),
    max: new Date("2030-12-31T23:59:59Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const paymentContextArb: fc.Arbitrary<PaymentContext> = fc.record({
  orderId: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  amount: fc.double({ min: 0.01, max: 10_000_000, noNaN: true }).filter((n) => n > 0),
  hotelName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  checkIn: isoDatetimeArb,
  checkOut: isoDatetimeArb,
  guestName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  environment: paymentEnvironmentArb,
  transactionId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  approvalNumber: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  errorCode: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  errorMessage: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  retryCount: fc.nat({ max: 100 }),
});

describe("PaymentContext Zod 스키마", () => {
  /**
   * Property 1: Zod 스키마 라운드트립 일관성
   * 유효한 PaymentContext 객체는 paymentContextSchema 파싱 후 원본과 동일해야 한다.
   *
   * **Validates: Requirements 1.5, 1.6**
   */
  it("Property 1: 유효한 PaymentContext는 파싱 후 원본과 동일해야 한다 (라운드트립 일관성)", () => {
    fc.assert(
      fc.property(paymentContextArb, (context) => {
        const result = paymentContextSchema.safeParse(context);

        // 파싱이 성공해야 한다
        expect(result.success).toBe(true);

        if (result.success) {
          // 파싱된 데이터가 원본과 동일해야 한다
          expect(result.data).toEqual(context);
        }
      }),
      { numRuns: 200 }
    );
  });
});
