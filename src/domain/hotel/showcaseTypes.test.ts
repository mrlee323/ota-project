import { describe, it, expect } from "vitest";
import {
  showcaseHotelCardSchema,
  regionTabSchema,
  regionShowcaseDataSchema,
  getHotelsForRegion,
  getRegionTab,
  formatPrice,
  isValidDiscount,
} from "./showcaseTypes";
import type {
  ShowcaseHotelCard,
  RegionTab,
  RegionShowcaseData,
} from "./showcaseTypes";

// ─── 테스트용 유효 데이터 ───────────────────────────────────────────────────

const validHotelCard: ShowcaseHotelCard = {
  id: "hotel-001",
  name: "그랜드 하얏트 교토",
  location: "교토",
  imageUrl: "https://example.com/hotel.jpg",
  stars: 5,
  discountRate: 20,
  originalPrice: 300000,
  discountPrice: 240000,
  isAppDiscount: true,
  taxIncluded: true,
  badges: ["플러스딜", "최저가보장"],
};

const validRegionTab: RegionTab = {
  id: "kyoto",
  name: "교토",
  themeText: "교토 벚꽃뷰 숙소",
  backgroundImageUrl: "https://example.com/kyoto-bg.jpg",
};

const validShowcaseData: RegionShowcaseData = {
  promoTitle: "3월 숙소, 지금이 가장 저렴해요!",
  regions: [
    { tab: validRegionTab, hotels: [validHotelCard] },
    {
      tab: { ...validRegionTab, id: "busan", name: "부산", themeText: "부산 오션뷰 숙소", backgroundImageUrl: "https://example.com/busan-bg.jpg" },
      hotels: [{ ...validHotelCard, id: "hotel-002", name: "파라다이스 호텔 부산", location: "부산" }],
    },
  ],
};

// ─── showcaseHotelCardSchema ────────────────────────────────────────────────

describe("showcaseHotelCardSchema", () => {
  it("유효한 호텔 카드 데이터를 파싱한다", () => {
    const result = showcaseHotelCardSchema.safeParse(validHotelCard);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validHotelCard);
  });

  it("discountRate가 없어도 성공한다 (optional)", () => {
    const { discountRate, ...withoutDiscount } = validHotelCard;
    const result = showcaseHotelCardSchema.safeParse(withoutDiscount);
    expect(result.success).toBe(true);
  });

  it("id가 빈 문자열이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, id: "" }).success).toBe(false);
  });

  it("stars가 0이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, stars: 0 }).success).toBe(false);
  });

  it("stars가 6이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, stars: 6 }).success).toBe(false);
  });

  it("originalPrice가 음수이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, originalPrice: -1 }).success).toBe(false);
  });

  it("imageUrl이 유효하지 않은 URL이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, imageUrl: "not-a-url" }).success).toBe(false);
  });

  it("discountRate가 101이면 실패한다", () => {
    expect(showcaseHotelCardSchema.safeParse({ ...validHotelCard, discountRate: 101 }).success).toBe(false);
  });
});

// ─── regionTabSchema ────────────────────────────────────────────────────────

describe("regionTabSchema", () => {
  it("유효한 지역 탭 데이터를 파싱한다", () => {
    const result = regionTabSchema.safeParse(validRegionTab);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validRegionTab);
  });

  it("name이 빈 문자열이면 실패한다", () => {
    expect(regionTabSchema.safeParse({ ...validRegionTab, name: "" }).success).toBe(false);
  });

  it("backgroundImageUrl이 유효하지 않은 URL이면 실패한다", () => {
    expect(regionTabSchema.safeParse({ ...validRegionTab, backgroundImageUrl: "invalid" }).success).toBe(false);
  });
});

// ─── regionShowcaseDataSchema ───────────────────────────────────────────────

describe("regionShowcaseDataSchema", () => {
  it("유효한 쇼케이스 데이터를 파싱한다", () => {
    const result = regionShowcaseDataSchema.safeParse(validShowcaseData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validShowcaseData);
  });

  it("promoTitle이 빈 문자열이면 실패한다", () => {
    expect(regionShowcaseDataSchema.safeParse({ ...validShowcaseData, promoTitle: "" }).success).toBe(false);
  });

  it("regions가 빈 배열이면 실패한다", () => {
    expect(regionShowcaseDataSchema.safeParse({ ...validShowcaseData, regions: [] }).success).toBe(false);
  });

  it("유효하지 않은 데이터에 대해 구체적인 검증 오류를 반환한다", () => {
    const result = regionShowcaseDataSchema.safeParse({ promoTitle: "", regions: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ─── getHotelsForRegion ─────────────────────────────────────────────────────

describe("getHotelsForRegion", () => {
  it("유효한 인덱스에 대해 호텔 리스트를 반환한다", () => {
    expect(getHotelsForRegion(validShowcaseData, 0)).toEqual([validHotelCard]);
  });

  it("유효하지 않은 인덱스에 대해 빈 배열을 반환한다", () => {
    expect(getHotelsForRegion(validShowcaseData, 99)).toEqual([]);
  });

  it("음수 인덱스에 대해 빈 배열을 반환한다", () => {
    expect(getHotelsForRegion(validShowcaseData, -1)).toEqual([]);
  });
});

// ─── getRegionTab ───────────────────────────────────────────────────────────

describe("getRegionTab", () => {
  it("유효한 인덱스에 대해 탭 정보를 반환한다", () => {
    expect(getRegionTab(validShowcaseData, 0)).toEqual(validRegionTab);
  });

  it("유효하지 않은 인덱스에 대해 undefined를 반환한다", () => {
    expect(getRegionTab(validShowcaseData, 99)).toBeUndefined();
  });
});

// ─── formatPrice ────────────────────────────────────────────────────────────

describe("formatPrice", () => {
  it("가격을 한국어 포맷으로 변환한다", () => {
    expect(formatPrice(150000)).toBe("150,000원~");
  });

  it("0원을 처리한다", () => {
    expect(formatPrice(0)).toBe("0원~");
  });
});

// ─── isValidDiscount ────────────────────────────────────────────────────────

describe("isValidDiscount", () => {
  it("할인 가격이 원래 가격 이하이면 유효하다", () => {
    expect(isValidDiscount(300000, 240000, 20)).toBe(true);
  });

  it("할인 가격이 원래 가격보다 크면 유효하지 않다", () => {
    expect(isValidDiscount(200000, 300000)).toBe(false);
  });

  it("할인율이 음수이면 유효하지 않다", () => {
    expect(isValidDiscount(300000, 240000, -1)).toBe(false);
  });

  it("할인율이 100 초과이면 유효하지 않다", () => {
    expect(isValidDiscount(300000, 240000, 101)).toBe(false);
  });

  it("할인율 없이도 유효성을 검증한다", () => {
    expect(isValidDiscount(300000, 240000)).toBe(true);
  });
});
