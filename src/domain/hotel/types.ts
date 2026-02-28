export type AccommodationType = "HOTEL" | "RESORT" | "PENSION" | "VILLA";

// 공통 기초 정보
export interface HotelBase {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  type: AccommodationType;
  stars: number;
  rating: number;
}

// 리스트용 (Summary)
export interface HotelSummary extends HotelBase {
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  thumbnailUrl: string;
}

// 상세 페이지용 (Detail)
export interface HotelDetail extends HotelSummary {
  description: string;
  images: string[];
  amenities: string[];
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

// ─── 메인 페이지용 타입 ─────────────────────────────────────────────────────

// 호텔 카드용 (메인 페이지 섹션에서 사용)
export interface HotelCardItem {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  originalPrice?: number;
  price: number;
  discount?: number;
  badge?: string;
  tags?: string[];
  promoTags?: string[];
  isLowestPrice?: boolean;
  isAI?: boolean;
  isBest?: boolean;
}

// 여행지 카드용
export interface Destination {
  name: string;
  image: string;
  hotelCount?: number;
}

// 탭 데이터
export interface HotelTabData {
  label: string;
  hotels: HotelCardItem[];
}

// 메인 페이지 전체 데이터
export interface HotelMainData {
  seoulHotels: HotelCardItem[];
  busanHotels: HotelCardItem[];
  jejuHotels: HotelCardItem[];
  gangwonHotels: HotelCardItem[];
  gyeongjuHotels: HotelCardItem[];
  hokangsTabs: HotelTabData[];
  overseasTabs: HotelTabData[];
  domesticDests: Destination[];
  overseasDests: Destination[];
}
