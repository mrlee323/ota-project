import type { SearchParams } from "@/domain/search/types";
import {
  serializeSearchParams,
  deserializeSearchParams,
  parseSearchParams,
} from "@/domain/search/validation";
import { createDefaultSearchParams } from "@/domain/search/defaults";

// 쿠키 키와 세션 스토리지 키
const COOKIE_KEY = "search_params";
const SESSION_KEY = "search_params";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

/** 검색 파라미터 영속화 어댑터 인터페이스 */
export interface SearchPersistenceAdapter {
  /** 저장소에서 검색 파라미터를 읽는다 (세션 스토리지 우선) */
  load(): SearchParams | null;
  /** 쿠키와 세션 스토리지에 동시 저장한다 */
  save(params: SearchParams): void;
  /** 서버 사이드에서 쿠키만으로 읽는다 */
  loadFromCookie(cookieHeader: string): SearchParams | null;
}

/**
 * 쿠키 헤더 문자열에서 특정 키의 값을 파싱한다.
 * @param cookieHeader - "key1=value1; key2=value2" 형식의 쿠키 문자열
 * @param key - 찾을 쿠키 키
 */
function parseCookieValue(cookieHeader: string, key: string): string | null {
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const eqIndex = cookie.indexOf("=");
    if (eqIndex === -1) continue;
    const cookieKey = cookie.substring(0, eqIndex).trim();
    const cookieValue = cookie.substring(eqIndex + 1).trim();
    if (cookieKey === key) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * 직렬화된 쿼리 문자열을 SearchParams로 변환하고 Zod 검증을 수행한다.
 * 검증 실패 시 null을 반환한다.
 */
function parseSerializedParams(serialized: string): SearchParams | null {
  try {
    const raw = deserializeSearchParams(serialized);
    return parseSearchParams(raw);
  } catch {
    return null;
  }
}

/** 세션 스토리지에서 검색 파라미터를 읽는다 (Zod 검증 포함) */
function loadFromSessionStorage(): SearchParams | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return parseSerializedParams(stored);
  } catch {
    // sessionStorage 접근 불가 (SSR 등)
    return null;
  }
}

/** document.cookie에서 검색 파라미터를 읽는다 (Zod 검증 포함) */
function loadFromBrowserCookie(): SearchParams | null {
  try {
    const cookieValue = parseCookieValue(document.cookie, COOKIE_KEY);
    if (!cookieValue) return null;
    return parseSerializedParams(cookieValue);
  } catch {
    return null;
  }
}

/** 세션 스토리지에 검색 파라미터를 저장한다 */
function saveToSessionStorage(serialized: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, serialized);
  } catch {
    // 세션 스토리지 접근 불가 시 무시
  }
}

/** 쿠키에 검색 파라미터를 저장한다 */
function saveToCookie(serialized: string): void {
  try {
    const encoded = encodeURIComponent(serialized);
    document.cookie = `${COOKIE_KEY}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // 쿠키 접근 불가 시 무시
  }
}

/** 기본값으로 폴백하고 저장소를 갱신한다 */
function fallbackToDefaults(): SearchParams {
  const defaults = createDefaultSearchParams();
  const serialized = serializeSearchParams(defaults);
  saveToSessionStorage(serialized);
  saveToCookie(serialized);
  return defaults;
}

/**
 * 검색 파라미터 영속화 어댑터를 생성한다.
 * 쿠키와 세션 스토리지를 조합하여 검색 파라미터를 영속화한다.
 */
export function createSearchPersistenceAdapter(): SearchPersistenceAdapter {
  return {
    load(): SearchParams | null {
      // 1단계: 세션 스토리지 우선
      const fromSession = loadFromSessionStorage();
      if (fromSession) return fromSession;

      // 2단계: 쿠키 폴백
      const fromCookie = loadFromBrowserCookie();
      if (fromCookie) {
        // 쿠키에서 읽은 값을 세션 스토리지에 복사 (탭 격리 준비)
        const serialized = serializeSearchParams(fromCookie);
        saveToSessionStorage(serialized);
        return fromCookie;
      }

      // 3단계: 둘 다 없으면 null
      return null;
    },

    save(params: SearchParams): void {
      const serialized = serializeSearchParams(params);
      // 세션 스토리지와 쿠키에 동시 저장
      saveToSessionStorage(serialized);
      saveToCookie(serialized);
    },

    loadFromCookie(cookieHeader: string): SearchParams | null {
      const cookieValue = parseCookieValue(cookieHeader, COOKIE_KEY);
      if (!cookieValue) return null;

      const parsed = parseSerializedParams(cookieValue);
      if (!parsed) return null;

      return parsed;
    },
  };
}

// 내부 함수 export (테스트용)
export {
  parseCookieValue,
  parseSerializedParams,
  COOKIE_KEY,
  SESSION_KEY,
  COOKIE_MAX_AGE,
  fallbackToDefaults,
};
