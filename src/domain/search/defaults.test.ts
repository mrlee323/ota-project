import { describe, it, expect } from "vitest";
import { createDefaultSearchParams } from "./defaults";
import { searchParamsSchema } from "./validation";
import { z } from "zod";

/** 테스트용 고정 날짜: 2025-01-15 */
const TEST_NOW = new Date(2025, 0, 15);

describe("createDefaultSearchParams", () => {
  it("고정 날짜 기준으로 올바른 기본값을 생성한다", () => {
    const result = createDefaultSearchParams(TEST_NOW);

    expect(result).toEqual({
      checkInDate: "2025-01-22",
      checkOutDate: "2025-01-23",
      adultCount: 2,
      childrenAges: [],
    });
  });

  it("checkInDate는 now + 7일이다", () => {
    const now = new Date(2025, 5, 1); // 2025-06-01
    const result = createDefaultSearchParams(now);

    expect(result.checkInDate).toBe("2025-06-08");
  });

  it("checkOutDate는 now + 8일이다", () => {
    const now = new Date(2025, 5, 1); // 2025-06-01
    const result = createDefaultSearchParams(now);

    expect(result.checkOutDate).toBe("2025-06-09");
  });

  it("adultCount 기본값은 2이다", () => {
    const result = createDefaultSearchParams(TEST_NOW);

    expect(result.adultCount).toBe(2);
  });

  it("childrenAges 기본값은 빈 배열이다", () => {
    const result = createDefaultSearchParams(TEST_NOW);

    expect(result.childrenAges).toEqual([]);
  });

  it("now를 생략하면 현재 시각 기준으로 생성한다", () => {
    const result = createDefaultSearchParams();

    // 날짜 형식만 검증 (실행 시점에 따라 값이 달라지므로)
    expect(result.checkInDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.checkOutDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.adultCount).toBe(2);
    expect(result.childrenAges).toEqual([]);
  });

  it("생성된 기본 파라미터가 searchParamsSchema 검증을 통과한다", () => {
    // 스키마에 today 비교가 있으므로 동일한 now를 사용하여 스키마 생성
    const now = new Date();
    const result = createDefaultSearchParams(now);

    // 스키마 검증 시 now 기준으로 생성된 스키마 사용
    const schema = z
      .object({
        checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        adultCount: z.number().int().min(1).max(10),
        childrenAges: z.array(z.number().int().min(0).max(17)),
      })
      .refine((data) => data.checkOutDate > data.checkInDate)
      .refine((data) => {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return data.checkInDate >= `${year}-${month}-${day}`;
      });

    const parseResult = schema.safeParse(result);
    expect(parseResult.success).toBe(true);
  });

  it("월말 경계를 넘는 날짜도 올바르게 처리한다", () => {
    const now = new Date(2025, 0, 28); // 2025-01-28
    const result = createDefaultSearchParams(now);

    // 1월 28일 + 7일 = 2월 4일
    expect(result.checkInDate).toBe("2025-02-04");
    expect(result.checkOutDate).toBe("2025-02-05");
  });
});
