import type {
  ShowcaseContent,
  ShowcaseCreationDraft,
} from "@/domain/admin/showcaseContent";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";

// ─── 인터페이스 정의 ────────────────────────────────────────────────────────

/** 쇼케이스 컨텐츠 CRUD Mock 서비스 인터페이스 */
export interface ShowcaseService {
  /** 관리자용 컨텐츠 목록 조회 (전체) */
  getShowcaseList(): Promise<ShowcaseContent[]>;
  /** 서비스 노출용 목록 조회 (serviceEnabled === true AND startDate ≤ now ≤ endDate) */
  getActiveShowcaseList(): Promise<ShowcaseContent[]>;
  /** 단건 조회 (존재하지 않으면 null) */
  getShowcaseById(id: string): Promise<ShowcaseContent | null>;
  /** 새 컨텐츠 생성 */
  createShowcase(draft: ShowcaseCreationDraft): Promise<ShowcaseContent>;
  /** 컨텐츠 수정 */
  updateShowcase(
    id: string,
    data: Partial<ShowcaseContent>,
  ): Promise<ShowcaseContent>;
  /** serviceEnabled 토글 */
  toggleServiceEnabled(
    id: string,
    enabled: boolean,
  ): Promise<ShowcaseContent>;
  /** 타이틀 생성 (AI mock) */
  generateTitle(cityName: string, prompt?: string): Promise<string>;
  /** 이미지 생성 (AI mock) */
  generateImage(cityName: string, title: string, prompt?: string): Promise<string>;
  /** 호텔 목록 생성 (AI mock) */
  generateHotels(cityName: string): Promise<ShowcaseHotelCard[]>;
}

// ─── 유틸리티 ───────────────────────────────────────────────────────────────

/** 인위적 지연을 위한 헬퍼 함수 (1~2초) */
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 1000~2000ms 사이 랜덤 지연 시간 반환 */
const randomDelay = () => Math.floor(Math.random() * 1000) + 1000;

/** UUID v4 생성 */
const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// ─── Mock 호텔 데이터 ───────────────────────────────────────────────────────

/** 도시별 Mock 호텔 카드 데이터 */
const mockHotelsByCity: Record<string, ShowcaseHotelCard[]> = {
  도쿄: [
    {
      id: "hotel-tokyo-001",
      name: "도쿄 그랜드 호텔",
      location: "신주쿠",
      imageUrl: "https://example.com/hotels/tokyo-grand.jpg",
      stars: 5,
      discountRate: 25,
      originalPrice: 320000,
      discountPrice: 240000,
      isAppDiscount: true,
      taxIncluded: true,
      badges: ["플러스딜", "최저가보장"],
    },
    {
      id: "hotel-tokyo-002",
      name: "시부야 비즈니스 호텔",
      location: "시부야",
      imageUrl: "https://example.com/hotels/shibuya-biz.jpg",
      stars: 3,
      discountRate: 15,
      originalPrice: 150000,
      discountPrice: 127500,
      isAppDiscount: false,
      taxIncluded: true,
      badges: ["조식포함"],
    },
    {
      id: "hotel-tokyo-003",
      name: "아사쿠사 료칸",
      location: "아사쿠사",
      imageUrl: "https://example.com/hotels/asakusa-ryokan.jpg",
      stars: 4,
      originalPrice: 280000,
      discountPrice: 280000,
      isAppDiscount: false,
      taxIncluded: false,
      badges: [],
    },
  ],
  오사카: [
    {
      id: "hotel-osaka-001",
      name: "오사카 리버사이드 호텔",
      location: "난바",
      imageUrl: "https://example.com/hotels/osaka-riverside.jpg",
      stars: 4,
      discountRate: 20,
      originalPrice: 250000,
      discountPrice: 200000,
      isAppDiscount: true,
      taxIncluded: true,
      badges: ["플러스딜"],
    },
    {
      id: "hotel-osaka-002",
      name: "도톤보리 스테이",
      location: "도톤보리",
      imageUrl: "https://example.com/hotels/dotonbori-stay.jpg",
      stars: 3,
      originalPrice: 120000,
      discountPrice: 120000,
      isAppDiscount: false,
      taxIncluded: true,
      badges: ["무료취소"],
    },
    {
      id: "hotel-osaka-003",
      name: "우메다 스카이 호텔",
      location: "우메다",
      imageUrl: "https://example.com/hotels/umeda-sky.jpg",
      stars: 5,
      discountRate: 30,
      originalPrice: 400000,
      discountPrice: 280000,
      isAppDiscount: true,
      taxIncluded: true,
      badges: ["최저가보장", "플러스딜"],
    },
  ],
  방콕: [
    {
      id: "hotel-bangkok-001",
      name: "방콕 리버뷰 호텔",
      location: "차오프라야",
      imageUrl: "https://example.com/hotels/bangkok-riverview.jpg",
      stars: 5,
      discountRate: 35,
      originalPrice: 280000,
      discountPrice: 182000,
      isAppDiscount: true,
      taxIncluded: true,
      badges: ["플러스딜", "최저가보장"],
    },
    {
      id: "hotel-bangkok-002",
      name: "카오산 게스트하우스",
      location: "카오산로드",
      imageUrl: "https://example.com/hotels/khaosan-guest.jpg",
      stars: 2,
      originalPrice: 45000,
      discountPrice: 45000,
      isAppDiscount: false,
      taxIncluded: false,
      badges: [],
    },
    {
      id: "hotel-bangkok-003",
      name: "수쿰빗 프리미엄 스위트",
      location: "수쿰빗",
      imageUrl: "https://example.com/hotels/sukhumvit-suite.jpg",
      stars: 4,
      discountRate: 10,
      originalPrice: 180000,
      discountPrice: 162000,
      isAppDiscount: false,
      taxIncluded: true,
      badges: ["조식포함"],
    },
  ],
};

// ─── Mock 쇼케이스 컨텐츠 데이터 ────────────────────────────────────────────

/** 초기 Mock 쇼케이스 컨텐츠 (다양한 노출 상태 포함) */
const mockShowcaseData: ShowcaseContent[] = [
  {
    // 현재 활성: serviceEnabled=true, 기간 내
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    cityName: "도쿄",
    title: "도쿄의 숨겨진 보석 같은 호텔 컬렉션",
    imageUrl: "https://example.com/showcases/tokyo-collection.jpg",
    hotels: mockHotelsByCity["도쿄"],
    serviceEnabled: true,
    startDate: "2024-01-15T00:00:00.000Z",
    endDate: "2025-12-31T23:59:59.000Z",
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-01-20T14:30:00.000Z",
  },
  {
    // 비활성: serviceEnabled=false, 기간 내
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    cityName: "오사카",
    title: "오사카 미식 여행자를 위한 특별 숙소",
    imageUrl: "https://example.com/showcases/osaka-gourmet.jpg",
    hotels: mockHotelsByCity["오사카"],
    serviceEnabled: false,
    startDate: "2024-02-01T00:00:00.000Z",
    endDate: "2025-12-31T23:59:59.000Z",
    createdAt: "2024-02-01T10:00:00.000Z",
    updatedAt: "2024-02-01T10:00:00.000Z",
  },
  {
    // 기간 만료: serviceEnabled=true, endDate 과거
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    cityName: "방콕",
    title: "방콕 럭셔리 리버뷰 호텔 베스트",
    imageUrl: "https://example.com/showcases/bangkok-luxury.jpg",
    hotels: mockHotelsByCity["방콕"],
    serviceEnabled: true,
    startDate: "2023-12-01T00:00:00.000Z",
    endDate: "2024-06-30T23:59:59.000Z",
    createdAt: "2023-12-01T08:00:00.000Z",
    updatedAt: "2024-01-10T16:00:00.000Z",
  },
  {
    // 아직 시작 안 됨: serviceEnabled=true, startDate 미래
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    cityName: "도쿄",
    title: "벚꽃 시즌 도쿄 프리미엄 호텔",
    imageUrl: "https://example.com/showcases/tokyo-sakura.jpg",
    hotels: mockHotelsByCity["도쿄"],
    serviceEnabled: true,
    startDate: "2026-03-01T00:00:00.000Z",
    endDate: "2026-05-31T23:59:59.000Z",
    createdAt: "2024-02-10T11:00:00.000Z",
    updatedAt: "2024-02-10T11:00:00.000Z",
  },
];

// ─── Mock 서비스 구현 ───────────────────────────────────────────────────────

/** 쇼케이스 컨텐츠 Mock 서비스 싱글톤 인스턴스 */
export const mockShowcaseService: ShowcaseService = {
  /** 관리자용 컨텐츠 목록 조회 (전체) */
  async getShowcaseList(): Promise<ShowcaseContent[]> {
    await delay(randomDelay());
    return [...mockShowcaseData];
  },

  /** 서비스 노출용 목록 조회 (활성 컨텐츠만 필터링) */
  async getActiveShowcaseList(): Promise<ShowcaseContent[]> {
    await delay(randomDelay());
    const now = new Date();
    return mockShowcaseData.filter(
      (item) =>
        item.serviceEnabled &&
        new Date(item.startDate) <= now &&
        now <= new Date(item.endDate),
    );
  },

  /** 단건 조회 (존재하지 않으면 null 반환) */
  async getShowcaseById(id: string): Promise<ShowcaseContent | null> {
    await delay(randomDelay());
    return mockShowcaseData.find((item) => item.id === id) ?? null;
  },

  /** 새 컨텐츠 생성 (serviceEnabled 기본값 true, 타임스탬프 설정) */
  async createShowcase(
    draft: ShowcaseCreationDraft,
  ): Promise<ShowcaseContent> {
    await delay(randomDelay());
    const now = new Date().toISOString();
    const newShowcase: ShowcaseContent = {
      id: generateUUID(),
      cityName: draft.cityName,
      title: draft.title,
      imageUrl: draft.imageUrl,
      hotels: draft.hotels,
      serviceEnabled: true,
      startDate: draft.startDate,
      endDate: draft.endDate,
      createdAt: now,
      updatedAt: now,
    };
    mockShowcaseData.push(newShowcase);
    return { ...newShowcase };
  },

  /** 컨텐츠 수정 (updatedAt 갱신) */
  async updateShowcase(
    id: string,
    data: Partial<ShowcaseContent>,
  ): Promise<ShowcaseContent> {
    await delay(randomDelay());
    const index = mockShowcaseData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`쇼케이스를 찾을 수 없습니다: ${id}`);
    }
    const updated: ShowcaseContent = {
      ...mockShowcaseData[index],
      ...data,
      id: mockShowcaseData[index].id, // id는 변경 불가
      updatedAt: new Date().toISOString(),
    };
    mockShowcaseData[index] = updated;
    return { ...updated };
  },

  /** serviceEnabled 토글 (updatedAt 갱신) */
  async toggleServiceEnabled(
    id: string,
    enabled: boolean,
  ): Promise<ShowcaseContent> {
    await delay(randomDelay());
    const index = mockShowcaseData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`쇼케이스를 찾을 수 없습니다: ${id}`);
    }
    mockShowcaseData[index] = {
      ...mockShowcaseData[index],
      serviceEnabled: enabled,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockShowcaseData[index] };
  },

  /** 타이틀 생성 (AI mock - 도시명 + 선택적 프롬프트 기반) */
  async generateTitle(cityName: string, prompt?: string): Promise<string> {
    await delay(randomDelay());
    if (prompt) return `${cityName} — ${prompt}`;
    const titles: Record<string, string> = {
      도쿄: "도쿄에서 만나는 특별한 숙소 컬렉션",
      오사카: "오사카의 매력을 담은 베스트 호텔",
      방콕: "방콕 여행의 완성, 프리미엄 호텔 가이드",
      교토: "교토 전통과 현대가 어우러진 숙소",
      싱가포르: "싱가포르 도심 속 럭셔리 호텔 추천",
    };
    return titles[cityName] ?? `${cityName} 추천 호텔 컬렉션`;
  },

  /** 이미지 생성 (AI mock - 도시명 기반 이미지 URL 반환) */
  async generateImage(cityName: string, title: string, _prompt?: string): Promise<string> {
    await delay(randomDelay());
    const slug = encodeURIComponent(cityName);
    return `https://example.com/generated/${slug}-${Date.now()}.jpg`;
  },

  /** 호텔 목록 생성 (AI mock - 도시별 호텔 카드 반환) */
  async generateHotels(cityName: string): Promise<ShowcaseHotelCard[]> {
    await delay(randomDelay());
    // 도시별 미리 정의된 호텔 데이터 반환, 없으면 기본 호텔 3건 생성
    if (mockHotelsByCity[cityName]) {
      return [...mockHotelsByCity[cityName]];
    }
    return [
      {
        id: `hotel-${cityName}-001`,
        name: `${cityName} 센트럴 호텔`,
        location: `${cityName} 중심가`,
        imageUrl: `https://example.com/hotels/${encodeURIComponent(cityName)}-central.jpg`,
        stars: 4,
        discountRate: 20,
        originalPrice: 200000,
        discountPrice: 160000,
        isAppDiscount: true,
        taxIncluded: true,
        badges: ["플러스딜"],
      },
      {
        id: `hotel-${cityName}-002`,
        name: `${cityName} 비즈니스 인`,
        location: `${cityName} 역 근처`,
        imageUrl: `https://example.com/hotels/${encodeURIComponent(cityName)}-business.jpg`,
        stars: 3,
        originalPrice: 120000,
        discountPrice: 120000,
        isAppDiscount: false,
        taxIncluded: true,
        badges: [],
      },
      {
        id: `hotel-${cityName}-003`,
        name: `${cityName} 프리미엄 리조트`,
        location: `${cityName} 외곽`,
        imageUrl: `https://example.com/hotels/${encodeURIComponent(cityName)}-resort.jpg`,
        stars: 5,
        discountRate: 15,
        originalPrice: 350000,
        discountPrice: 297500,
        isAppDiscount: true,
        taxIncluded: true,
        badges: ["최저가보장", "조식포함"],
      },
    ];
  },
};
