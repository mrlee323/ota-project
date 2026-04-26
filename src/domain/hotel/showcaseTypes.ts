import { z } from "zod";

// ─── Zod 스키마 정의 ────────────────────────────────────────────────────────

/** 쇼케이스 호텔 카드 스키마 */
export const showcaseHotelCardSchema = z.object({
  /** 호텔 고유 ID */
  id: z.string().min(1),
  /** 호텔명 */
  name: z.string().min(1),
  /** 지역명 */
  location: z.string().min(1),
  /** 호텔 이미지 URL */
  imageUrl: z.string().url(),
  /** 등급 (1~5성급) */
  stars: z.number().int().min(1).max(5),
  /** 할인율 (0~100%, 선택) */
  discountRate: z.number().min(0).max(100).optional(),
  /** 원래 가격 */
  originalPrice: z.number().nonnegative(),
  /** 할인 가격 */
  discountPrice: z.number().nonnegative(),
  /** 앱 할인 여부 */
  isAppDiscount: z.boolean(),
  /** 세금 및 봉사료 포함 여부 */
  taxIncluded: z.boolean(),
  /** 뱃지 목록 (플러스딜, 최저가보장 등) */
  badges: z.array(z.string()),
});

/** 지역 탭 스키마 */
export const regionTabSchema = z.object({
  /** 지역 고유 ID */
  id: z.string().min(1),
  /** 지역명 */
  name: z.string().min(1),
  /** 테마 텍스트 (예: "교토 벚꽃뷰 숙소") */
  themeText: z.string().min(1),
  /** 배경 이미지 URL */
  backgroundImageUrl: z.string().url(),
});

/** 쇼케이스 전체 데이터 스키마 */
export const regionShowcaseDataSchema = z.object({
  /** 프로모션 타이틀 */
  promoTitle: z.string().min(1),
  /** 지역별 탭 + 호텔 리스트 (최소 1개 지역) */
  regions: z
    .array(
      z.object({
        tab: regionTabSchema,
        hotels: z.array(showcaseHotelCardSchema),
      }),
    )
    .min(1),
});

// ─── TypeScript 타입 (Zod 스키마에서 추론) ──────────────────────────────────

/** 쇼케이스 호텔 카드 */
export type ShowcaseHotelCard = z.infer<typeof showcaseHotelCardSchema>;

/** 지역 탭 */
export type RegionTab = z.infer<typeof regionTabSchema>;

/** 쇼케이스 전체 데이터 */
export type RegionShowcaseData = z.infer<typeof regionShowcaseDataSchema>;

// ─── 순수 함수 ──────────────────────────────────────────────────────────────

/**
 * 선택된 지역의 호텔 리스트를 반환한다.
 * 유효하지 않은 인덱스일 경우 빈 배열을 반환한다.
 */
export function getHotelsForRegion(
  data: RegionShowcaseData,
  regionIndex: number,
): ShowcaseHotelCard[] {
  const region = data.regions[regionIndex];
  return region ? region.hotels : [];
}

/**
 * 선택된 지역의 탭 정보를 반환한다.
 * 유효하지 않은 인덱스일 경우 undefined를 반환한다.
 */
export function getRegionTab(
  data: RegionShowcaseData,
  regionIndex: number,
): RegionTab | undefined {
  return data.regions[regionIndex]?.tab;
}

/**
 * 가격을 한국어 포맷으로 변환한다.
 * 예: 150000 → "150,000원~"
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원~`;
}

/**
 * 할인 가격의 유효성을 검증한다.
 * - 할인 가격이 원래 가격보다 크면 유효하지 않음
 * - 할인율이 0~100 범위를 벗어나면 유효하지 않음
 */
export function isValidDiscount(
  originalPrice: number,
  discountPrice: number,
  discountRate?: number,
): boolean {
  if (discountPrice > originalPrice) return false;
  if (discountRate !== undefined && (discountRate < 0 || discountRate > 100))
    return false;
  return true;
}
