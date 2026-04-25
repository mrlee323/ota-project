import { describe, it, expect } from "vitest";
import { resolveInitialSearchParams } from "./useSearchParamsSync";
import type { SearchParams } from "@/domain/search/types";
import type { RawSearchParams } from "@/domain/search/types";

/** 테스트용 고정 날짜 (2025-01-15) */
const TEST_NOW = new Date("2025-01-15T00:00:00");

/** 유효한 영속화 저장소 데이터 */
const validPersisted: SearchParams = {
  checkInDate: "2025-01-22",
  checkOutDate: "2025-01-23",
  adultCount: 2,
  childrenAges: [],
};

/** 유효한 URL 원시 파라미터 */
const validRawFromUrl: RawSearchParams = {
  checkInDate: "2025-01-25",
  checkOutDate: "2025-01-26",
  adultCount: "3",
  childrenAges: "5,10",
};

describe("resolveInitialSearchParams", () => {
  describe("영속화 저장소에 값이 있는 경우", () => {
    it("영속화 저장소 값을 우선 사용한다", () => {
      const result = resolveInitialSearchParams(validPersisted, validRawFromUrl, TEST_NOW);

      expect(result.params).toEqual(validPersisted);
      expect(result.source).toBe("persistence");
    });

    it("영속화 저장소에서 온 경우 추가 저장이 불필요하다", () => {
      const result = resolveInitialSearchParams(validPersisted, {}, TEST_NOW);

      expect(result.shouldPersist).toBe(false);
    });

    it("영속화 저장소에서 온 경우 URL 갱신이 필요하다", () => {
      const result = resolveInitialSearchParams(validPersisted, {}, TEST_NOW);

      expect(result.shouldUpdateUrl).toBe(true);
    });

    it("인원 정보(childrenAges 포함)도 영속화 저장소에서 복원한다", () => {
      const persistedWithChildren: SearchParams = {
        ...validPersisted,
        adultCount: 2,
        childrenAges: [3, 7, 12],
      };

      const result = resolveInitialSearchParams(persistedWithChildren, {}, TEST_NOW);

      expect(result.params.adultCount).toBe(2);
      expect(result.params.childrenAges).toEqual([3, 7, 12]);
    });
  });

  describe("영속화 저장소가 비어있고 URL에 유효한 파라미터가 있는 경우", () => {
    it("URL 파라미터를 파싱하여 사용한다", () => {
      const result = resolveInitialSearchParams(null, validRawFromUrl, TEST_NOW);

      expect(result.params.checkInDate).toBe("2025-01-25");
      expect(result.params.checkOutDate).toBe("2025-01-26");
      expect(result.params.adultCount).toBe(3);
      expect(result.params.childrenAges).toEqual([5, 10]);
      expect(result.source).toBe("url");
    });

    it("URL에서 파싱한 값은 영속화 저장소에 저장해야 한다", () => {
      const result = resolveInitialSearchParams(null, validRawFromUrl, TEST_NOW);

      expect(result.shouldPersist).toBe(true);
    });

    it("URL에서 파싱한 경우 URL 갱신이 불필요하다", () => {
      const result = resolveInitialSearchParams(null, validRawFromUrl, TEST_NOW);

      expect(result.shouldUpdateUrl).toBe(false);
    });
  });

  describe("영속화 저장소와 URL 모두 없는 경우", () => {
    it("기본값을 생성한다", () => {
      const result = resolveInitialSearchParams(null, {}, TEST_NOW);

      // 기본값: 체크인 = now + 7일, 체크아웃 = now + 8일
      expect(result.params.checkInDate).toBe("2025-01-22");
      expect(result.params.checkOutDate).toBe("2025-01-23");
      expect(result.params.adultCount).toBe(2);
      expect(result.params.childrenAges).toEqual([]);
      expect(result.source).toBe("defaults");
    });

    it("기본값은 영속화 저장소에 저장해야 한다", () => {
      const result = resolveInitialSearchParams(null, {}, TEST_NOW);

      expect(result.shouldPersist).toBe(true);
    });

    it("기본값은 URL 갱신이 필요하다", () => {
      const result = resolveInitialSearchParams(null, {}, TEST_NOW);

      expect(result.shouldUpdateUrl).toBe(true);
    });
  });

  describe("URL에 유효하지 않은 파라미터가 있는 경우", () => {
    it("체크아웃이 체크인 이전이면 기본값으로 폴백한다", () => {
      const invalidRaw: RawSearchParams = {
        checkInDate: "2025-01-25",
        checkOutDate: "2025-01-20", // 체크인 이전
        adultCount: "2",
      };

      const result = resolveInitialSearchParams(null, invalidRaw, TEST_NOW);

      expect(result.source).toBe("defaults");
    });

    it("체크인이 오늘 이전이면 기본값으로 폴백한다", () => {
      const invalidRaw: RawSearchParams = {
        checkInDate: "2025-01-10", // 오늘(01-15) 이전
        checkOutDate: "2025-01-11",
        adultCount: "2",
      };

      const result = resolveInitialSearchParams(null, invalidRaw, TEST_NOW);

      expect(result.source).toBe("defaults");
    });

    it("adultCount가 숫자가 아니면 기본값으로 폴백한다", () => {
      const invalidRaw: RawSearchParams = {
        checkInDate: "2025-01-22",
        checkOutDate: "2025-01-23",
        adultCount: "abc",
      };

      const result = resolveInitialSearchParams(null, invalidRaw, TEST_NOW);

      expect(result.source).toBe("defaults");
    });
  });
});
