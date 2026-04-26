import type {
  AutoConfig,
  UpdateAutoConfigInput,
} from "@/domain/admin/autoConfig";

// ─── 인터페이스 정의 ────────────────────────────────────────────────────────

/** 자동 생성 설정 Mock 서비스 인터페이스 */
export interface AutoConfigService {
  /** 현재 설정 조회 */
  getAutoConfig(): Promise<AutoConfig>;
  /** 설정 업데이트 (부분 업데이트 지원) */
  updateAutoConfig(input: UpdateAutoConfigInput): Promise<AutoConfig>;
}

// ─── 유틸리티 ───────────────────────────────────────────────────────────────

/** 인위적 지연을 위한 헬퍼 함수 (1~2초) */
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 1000~2000ms 사이 랜덤 지연 시간 반환 */
const randomDelay = () => Math.floor(Math.random() * 1000) + 1000;

// ─── Mock 데이터 ────────────────────────────────────────────────────────────

/** 기본 자동 생성 설정 mock 데이터 */
const tomorrow8am = new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(8, 0, 0, 0));
const dayAfterTomorrow = new Date(new Date(tomorrow8am).setDate(tomorrow8am.getDate() + 1));
dayAfterTomorrow.setHours(0, 0, 0, 0);
const dayAfterTomorrowEnd = new Date(dayAfterTomorrow);
dayAfterTomorrowEnd.setHours(23, 59, 0, 0);

let currentConfig: AutoConfig = {
  enabled: true,
  intervalType: "day",
  intervalValue: 1,
  nextGenerationDate: tomorrow8am.toISOString(),
  suggestedCities: ["도쿄", "오사카", "방콕"],
  contentStartDate: dayAfterTomorrow.toISOString(),
  contentEndDate: dayAfterTomorrowEnd.toISOString(),
};

// ─── Mock 서비스 구현 ───────────────────────────────────────────────────────

/** 자동 생성 설정 Mock 서비스 싱글톤 인스턴스 */
export const mockAutoConfigService: AutoConfigService = {
  /** 현재 자동 생성 설정 조회 */
  async getAutoConfig(): Promise<AutoConfig> {
    await delay(randomDelay());
    return { ...currentConfig };
  },

  /** 자동 생성 설정 부분 업데이트 (입력값을 현재 설정에 병합) */
  async updateAutoConfig(input: UpdateAutoConfigInput): Promise<AutoConfig> {
    await delay(randomDelay());
    currentConfig = {
      ...currentConfig,
      ...input,
    };
    return { ...currentConfig };
  },
};
