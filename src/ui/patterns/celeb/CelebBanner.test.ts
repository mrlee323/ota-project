import { describe, it, expect } from "vitest";
import { buildBannerHref } from "./CelebBanner";
import type { SearchParams } from "@/domain/search/types";

// ─── 테스트용 검색 파라미터 ─────────────────────────────────────────────────

const defaultSearchParams: SearchParams = {
  checkInDate: "2025-08-01",
  checkOutDate: "2025-08-02",
  adultCount: 2,
  childrenAges: [],
};

// ─── buildBannerHref 테스트 ─────────────────────────────────────────────────

describe("buildBannerHref", () => {
  it("올바른 호텔 경로를 포함한다", () => {
    const href = buildBannerHref("hotel-123", "celeb-1", defaultSearchParams);

    expect(href).toMatch(/^\/hotel\/hotel-123\?/);
  });

  it("utm_source=celeb 파라미터를 포함한다", () => {
    const href = buildBannerHref("1", "celeb-1", defaultSearchParams);

    expect(href).toContain("utm_source=celeb");
  });

  it("celeb_id 파라미터에 셀럽 ID를 포함한다", () => {
    const href = buildBannerHref("1", "celeb-abc", defaultSearchParams);

    expect(href).toContain("celeb_id=celeb-abc");
  });

  it("검색 파라미터(체크인/체크아웃/인원)를 포함한다", () => {
    const href = buildBannerHref("1", "celeb-1", defaultSearchParams);

    expect(href).toContain("checkInDate=2025-08-01");
    expect(href).toContain("checkOutDate=2025-08-02");
    expect(href).toContain("adultCount=2");
  });

  it("childrenAges가 있으면 쿼리에 포함한다", () => {
    const params: SearchParams = {
      ...defaultSearchParams,
      childrenAges: [3, 7],
    };
    const href = buildBannerHref("1", "celeb-1", params);

    expect(href).toContain("childrenAges=3%2C7");
  });

  it("childrenAges가 빈 배열이면 쿼리에서 생략한다", () => {
    const href = buildBannerHref("1", "celeb-1", defaultSearchParams);

    expect(href).not.toContain("childrenAges");
  });

  it("전체 URL 형식이 /hotel/{hotelId}?utm_source=celeb&celeb_id={celebId}&... 패턴을 따른다", () => {
    const href = buildBannerHref("42", "celeb-99", defaultSearchParams);

    // 경로 + utm_source + celeb_id 순서 확인
    expect(href).toMatch(
      /^\/hotel\/42\?utm_source=celeb&celeb_id=celeb-99&/,
    );
  });
});
