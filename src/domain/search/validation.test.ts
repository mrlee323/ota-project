import { describe, it, expect } from "vitest";
import {
  parseSearchParams,
  serializeSearchParams,
  deserializeSearchParams,
} from "./validation";

/** 테스트용 고정 날짜: 2025-01-15 */
const TEST_NOW = new Date(2025, 0, 15);

describe("parseSearchParams", () => {
  it("유효한 원시 파라미터를 SearchParams로 파싱한다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-20",
        checkOutDate: "2025-01-22",
        adultCount: "2",
        childrenAges: "3,7",
      },
      TEST_NOW,
    );

    expect(result).toEqual({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 2,
      childrenAges: [3, 7],
    });
  });

  it("childrenAges가 없으면 빈 배열로 파싱한다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-20",
        checkOutDate: "2025-01-22",
        adultCount: "2",
      },
      TEST_NOW,
    );

    expect(result).toEqual({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 2,
      childrenAges: [],
    });
  });

  it("checkOutDate가 checkInDate 이전이면 null을 반환한다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-22",
        checkOutDate: "2025-01-20",
        adultCount: "2",
      },
      TEST_NOW,
    );

    expect(result).toBeNull();
  });

  it("checkOutDate가 checkInDate와 같으면 null을 반환한다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-20",
        checkOutDate: "2025-01-20",
        adultCount: "2",
      },
      TEST_NOW,
    );

    expect(result).toBeNull();
  });

  it("checkInDate가 오늘보다 이전이면 null을 반환한다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-14",
        checkOutDate: "2025-01-16",
        adultCount: "2",
      },
      TEST_NOW,
    );

    expect(result).toBeNull();
  });

  it("checkInDate가 오늘이면 유효하다", () => {
    const result = parseSearchParams(
      {
        checkInDate: "2025-01-15",
        checkOutDate: "2025-01-16",
        adultCount: "2",
      },
      TEST_NOW,
    );

    expect(result).not.toBeNull();
  });

  it("adultCount가 범위 밖이면 null을 반환한다", () => {
    expect(
      parseSearchParams(
        { checkInDate: "2025-01-20", checkOutDate: "2025-01-22", adultCount: "0" },
        TEST_NOW,
      ),
    ).toBeNull();

    expect(
      parseSearchParams(
        { checkInDate: "2025-01-20", checkOutDate: "2025-01-22", adultCount: "11" },
        TEST_NOW,
      ),
    ).toBeNull();
  });

  it("childrenAges 원소가 범위 밖이면 null을 반환한다", () => {
    expect(
      parseSearchParams(
        {
          checkInDate: "2025-01-20",
          checkOutDate: "2025-01-22",
          adultCount: "2",
          childrenAges: "18",
        },
        TEST_NOW,
      ),
    ).toBeNull();

    expect(
      parseSearchParams(
        {
          checkInDate: "2025-01-20",
          checkOutDate: "2025-01-22",
          adultCount: "2",
          childrenAges: "-1",
        },
        TEST_NOW,
      ),
    ).toBeNull();
  });

  it("잘못된 날짜 형식이면 null을 반환한다", () => {
    expect(
      parseSearchParams(
        { checkInDate: "01-20-2025", checkOutDate: "2025-01-22", adultCount: "2" },
        TEST_NOW,
      ),
    ).toBeNull();
  });
});

describe("serializeSearchParams", () => {
  it("SearchParams를 쿼리 문자열로 직렬화한다", () => {
    const qs = serializeSearchParams({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 2,
      childrenAges: [3, 7],
    });

    expect(qs).toBe(
      "checkInDate=2025-01-20&checkOutDate=2025-01-22&adultCount=2&childrenAges=3%2C7",
    );
  });

  it("childrenAges가 빈 배열이면 파라미터를 생략한다", () => {
    const qs = serializeSearchParams({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 2,
      childrenAges: [],
    });

    expect(qs).toBe(
      "checkInDate=2025-01-20&checkOutDate=2025-01-22&adultCount=2",
    );
    expect(qs).not.toContain("childrenAges");
  });
});

describe("deserializeSearchParams", () => {
  it("쿼리 문자열을 RawSearchParams로 변환한다", () => {
    const raw = deserializeSearchParams(
      "checkInDate=2025-01-20&checkOutDate=2025-01-22&adultCount=2&childrenAges=3%2C7",
    );

    expect(raw).toEqual({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: "2",
      childrenAges: "3,7",
    });
  });

  it("childrenAges가 없으면 해당 필드를 포함하지 않는다", () => {
    const raw = deserializeSearchParams(
      "checkInDate=2025-01-20&checkOutDate=2025-01-22&adultCount=2",
    );

    expect(raw).toEqual({
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: "2",
    });
    expect(raw).not.toHaveProperty("childrenAges");
  });

  it("빈 쿼리 문자열이면 빈 객체를 반환한다", () => {
    expect(deserializeSearchParams("")).toEqual({});
  });
});

describe("직렬화/파싱 라운드트립", () => {
  it("유효한 SearchParams를 직렬화 후 파싱하면 원본과 동일하다", () => {
    const original = {
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 2,
      childrenAges: [3, 7, 12],
    };

    const serialized = serializeSearchParams(original);
    const deserialized = deserializeSearchParams(serialized);
    const parsed = parseSearchParams(deserialized, TEST_NOW);

    expect(parsed).toEqual(original);
  });

  it("childrenAges 빈 배열도 라운드트립이 보존된다", () => {
    const original = {
      checkInDate: "2025-01-20",
      checkOutDate: "2025-01-22",
      adultCount: 1,
      childrenAges: [],
    };

    const serialized = serializeSearchParams(original);
    const deserialized = deserializeSearchParams(serialized);
    const parsed = parseSearchParams(deserialized, TEST_NOW);

    expect(parsed).toEqual(original);
  });
});
