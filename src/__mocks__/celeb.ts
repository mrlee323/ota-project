import type {
  Celeb,
  GroupBuyCampaign,
  CelebBannerItem,
} from "@/domain/celeb/types";

// ─── 셀럽 mock 데이터 ──────────────────────────────────────────────────────

export const mockCelebs: Celeb[] = [
  {
    id: "celeb-1",
    name: "김여행",
    profileImageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    introduction:
      "여행 크리에이터 김여행입니다. 숨은 호캉스 명소를 소개합니다!",
  },
  {
    id: "celeb-2",
    name: "이호캉",
    profileImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    introduction: "호캉스 전문 인플루언서 이호캉! 최고의 호텔만 엄선합니다.",
  },
  {
    id: "celeb-3",
    name: "박럭셔리",
    profileImageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    introduction: "럭셔리 트래블러 박럭셔리의 프리미엄 호텔 추천.",
  },
];

// ─── 캠페인 mock 데이터 ─────────────────────────────────────────────────────

export const mockCampaigns: GroupBuyCampaign[] = [
  {
    id: "campaign-1",
    celebId: "celeb-1",
    hotelId: "1",
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    status: "ENDED",
  },
  {
    id: "campaign-2",
    celebId: "celeb-2",
    hotelId: "2",
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    status: "ACTIVE",
  },
  {
    id: "campaign-3",
    celebId: "celeb-3",
    hotelId: "3",
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-17-31T23:59:59Z",
    status: "UPCOMING",
  },
];

// ─── 배너 mock 데이터 (활성 캠페인만) ───────────────────────────────────────

export const mockCelebBanners: CelebBannerItem[] = [
  {
    campaignId: "campaign-1",
    celeb: mockCelebs[0],
    hotelId: "1",
    hotelName: "그랜드 워커힐 서울",
    discountRate: 35,
    bannerImageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    campaignId: "campaign-2",
    celeb: mockCelebs[1],
    hotelId: "2",
    hotelName: "신라 호텔 제주",
    discountRate: 25,
    bannerImageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
];
