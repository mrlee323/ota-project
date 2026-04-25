import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSearchPersistenceAdapter,
  parseCookieValue,
  parseSerializedParams,
  COOKIE_KEY,
  SESSION_KEY,
  COOKIE_MAX_AGE,
} from "./searchPersistence";
import { serializeSearchParams } from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";
import type { SearchParams } from "@/domain/search/types";

// 테스트용 유효한 검색 파라미터 (미래 날짜 사용)
function createTestParams(): SearchParams {
  const now = new Date();
  const checkIn = new Date(now);
  checkIn.setDate(checkIn.getDate() + 10);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);

  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    checkInDate: format(checkIn),
    checkOutDate: format(checkOut),
    adultCount: 2,
    childrenAges: [5, 10],
  };
}

describe("parseCookieValue", () => {
  it("쿠키 헤더에서 특정 키의 값을 파싱한다", () => {
    const header = "foo=bar; search_params=hello%20world; baz=qux";
    expect(parseCookieValue(header, "search_params")).toBe("hello world");
  });

  it("키가 없으면 null을 반환한다", () => {
    const header = "foo=bar; baz=qux";
    expect(parseCookieValue(header, "search_params")).toBeNull();
  });

  it("빈 문자열이면 null을 반환한다", () => {
    expect(parseCookieValue("", "search_params")).toBeNull();
  });

  it("값에 = 문자가 포함된 쿠키를 올바르게 파싱한다", () => {
    const header = "key=val=ue; other=test";
    expect(parseCookieValue(header, "key")).toBe("val=ue");
  });
});

describe("parseSerializedParams", () => {
  it("유효한 직렬화 문자열을 SearchParams로 변환한다", () => {
    const params = createTestParams();
    const serialized = serializeSearchParams(params);
    const result = parseSerializedParams(serialized);

    expect(result).toEqual(params);
  });

  it("유효하지 않은 문자열이면 null을 반환한다", () => {
    expect(parseSerializedParams("invalid=data")).toBeNull();
  });

  it("빈 문자열이면 null을 반환한다", () => {
    expect(parseSerializedParams("")).toBeNull();
  });
});

describe("createSearchPersistenceAdapter", () => {
  let sessionStore: Record<string, string>;
  let cookieStore: string;

  beforeEach(() => {
    sessionStore = {};
    cookieStore = "";

    // sessionStorage 모킹
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => sessionStore[key] ?? null,
        setItem: (key: string, value: string) => {
          sessionStore[key] = value;
        },
        removeItem: (key: string) => {
          delete sessionStore[key];
        },
      },
      writable: true,
      configurable: true,
    });

    // document.cookie 모킹
    Object.defineProperty(document, "cookie", {
      get: () => cookieStore,
      set: (val: string) => {
        // 간단한 쿠키 저장 시뮬레이션 (key=value 부분만 추출)
        const parts = val.split(";");
        const keyVal = parts[0].trim();
        const eqIdx = keyVal.indexOf("=");
        if (eqIdx === -1) return;
        const key = keyVal.substring(0, eqIdx);

        // 기존 쿠키에서 같은 키 제거 후 추가
        const existing = cookieStore
          .split(";")
          .map((c) => c.trim())
          .filter((c) => {
            const cKey = c.split("=")[0]?.trim();
            return cKey && cKey !== key;
          });
        existing.push(keyVal);
        cookieStore = existing.filter(Boolean).join("; ");
      },
      configurable: true,
    });
  });

  describe("load()", () => {
    it("세션 스토리지에 값이 있으면 세션 스토리지 값을 우선 반환한다", () => {
      const params = createTestParams();
      const serialized = serializeSearchParams(params);
      sessionStore[SESSION_KEY] = serialized;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.load();

      expect(result).toEqual(params);
    });

    it("세션 스토리지가 비어있고 쿠키에 값이 있으면 쿠키 값을 반환한다", () => {
      const params = createTestParams();
      const serialized = serializeSearchParams(params);
      const encoded = encodeURIComponent(serialized);
      cookieStore = `${COOKIE_KEY}=${encoded}`;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.load();

      expect(result).toEqual(params);
    });

    it("쿠키에서 읽은 값을 세션 스토리지에 복사한다", () => {
      const params = createTestParams();
      const serialized = serializeSearchParams(params);
      const encoded = encodeURIComponent(serialized);
      cookieStore = `${COOKIE_KEY}=${encoded}`;

      const adapter = createSearchPersistenceAdapter();
      adapter.load();

      // 세션 스토리지에 복사되었는지 확인
      expect(sessionStore[SESSION_KEY]).toBe(serialized);
    });

    it("세션 스토리지와 쿠키 모두 비어있으면 null을 반환한다", () => {
      const adapter = createSearchPersistenceAdapter();
      const result = adapter.load();

      expect(result).toBeNull();
    });

    it("세션 스토리지에 유효하지 않은 데이터가 있으면 쿠키로 폴백한다", () => {
      sessionStore[SESSION_KEY] = "invalid-data";
      const params = createTestParams();
      const serialized = serializeSearchParams(params);
      const encoded = encodeURIComponent(serialized);
      cookieStore = `${COOKIE_KEY}=${encoded}`;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.load();

      expect(result).toEqual(params);
    });

    it("세션 스토리지와 쿠키 모두 유효하지 않은 데이터면 null을 반환한다", () => {
      sessionStore[SESSION_KEY] = "invalid";
      cookieStore = `${COOKIE_KEY}=${encodeURIComponent("also-invalid")}`;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.load();

      expect(result).toBeNull();
    });
  });

  describe("save()", () => {
    it("세션 스토리지와 쿠키에 동시 저장한다", () => {
      const params = createTestParams();
      const serialized = serializeSearchParams(params);

      const adapter = createSearchPersistenceAdapter();
      adapter.save(params);

      // 세션 스토리지 확인
      expect(sessionStore[SESSION_KEY]).toBe(serialized);

      // 쿠키 확인 (인코딩된 값 포함)
      expect(cookieStore).toContain(COOKIE_KEY);
      expect(cookieStore).toContain(encodeURIComponent(serialized));
    });

    it("저장 후 load()로 동일한 값을 읽을 수 있다", () => {
      const params = createTestParams();

      const adapter = createSearchPersistenceAdapter();
      adapter.save(params);
      const loaded = adapter.load();

      expect(loaded).toEqual(params);
    });
  });

  describe("loadFromCookie()", () => {
    it("쿠키 헤더 문자열에서 검색 파라미터를 파싱한다", () => {
      const params = createTestParams();
      const serialized = serializeSearchParams(params);
      const encoded = encodeURIComponent(serialized);
      const cookieHeader = `other=value; ${COOKIE_KEY}=${encoded}; another=test`;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.loadFromCookie(cookieHeader);

      expect(result).toEqual(params);
    });

    it("쿠키 헤더에 해당 키가 없으면 null을 반환한다", () => {
      const adapter = createSearchPersistenceAdapter();
      const result = adapter.loadFromCookie("other=value; foo=bar");

      expect(result).toBeNull();
    });

    it("유효하지 않은 데이터가 저장되어 있으면 null을 반환한다", () => {
      const cookieHeader = `${COOKIE_KEY}=${encodeURIComponent("bad-data")}`;

      const adapter = createSearchPersistenceAdapter();
      const result = adapter.loadFromCookie(cookieHeader);

      expect(result).toBeNull();
    });

    it("빈 쿠키 헤더이면 null을 반환한다", () => {
      const adapter = createSearchPersistenceAdapter();
      const result = adapter.loadFromCookie("");

      expect(result).toBeNull();
    });
  });
});
