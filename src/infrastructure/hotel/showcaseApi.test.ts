import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRegionShowcase } from "./showcaseApi";
import type { RegionShowcaseData } from "@/domain/hotel/showcaseTypes";

// httpClient를 모킹하여 네트워크 레이어를 격리한다
vi.mock("@/infrastructure/http/client", () => ({
  httpClient: vi.fn(),
}));

import { httpClient } from "@/infrastructure/http/client";

const mockedHttpClient = vi.mocked(httpClient);

/** 유효한 쇼케이스 응답 데이터 */
const validResponse: RegionShowcaseData = {
  promoTitle: "3월 숙소, 지금이 가장 저렴해요!",
  regions: [
    {
      tab: {
        id: "kyoto",
        name: "교토",
        themeText: "교토 벚꽃뷰 숙소",
        backgroundImageUrl: "https://example.com/kyoto.jpg",
      },
      hotels: [
        {
          id: "hotel-1",
          name: "교토 그랜드 호텔",
          location: "교토",
          imageUrl: "https://example.com/hotel1.jpg",
          stars: 5,
          discountRate: 30,
          originalPrice: 200000,
          discountPrice: 140000,
          isAppDiscount: true,
          taxIncluded: true,
          badges: ["플러스딜", "최저가보장"],
        },
      ],
    },
  ],
};

describe("fetchRegionShowcase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 응답 데이터를 Zod 검증 후 반환한다", async () => {
    mockedHttpClient.mockResolvedValue(validResponse);

    const result = await fetchRegionShowcase();

    expect(mockedHttpClient).toHaveBeenCalledWith("/api/hotel/showcase");
    expect(result).toEqual(validResponse);
  });

  it("네트워크 오류 시 에러를 throw한다", async () => {
    mockedHttpClient.mockRejectedValue(new Error("HTTP 500: /api/hotel/showcase"));

    await expect(fetchRegionShowcase()).rejects.toThrow("HTTP 500");
  });

  it("Zod 검증 실패 시 ZodError를 throw한다", async () => {
    // 필수 필드가 누락된 잘못된 응답
    mockedHttpClient.mockResolvedValue({ promoTitle: "" });

    await expect(fetchRegionShowcase()).rejects.toThrow();
  });

  it("잘못된 타입의 응답 데이터에 대해 ZodError를 throw한다", async () => {
    mockedHttpClient.mockResolvedValue({
      promoTitle: "프로모션",
      regions: [
        {
          tab: { id: "kyoto", name: "교토", themeText: "테마", backgroundImageUrl: "not-a-url" },
          hotels: [],
        },
      ],
    });

    await expect(fetchRegionShowcase()).rejects.toThrow();
  });
});
