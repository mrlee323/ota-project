/**
 * Inngest 이벤트 타입 정의
 * EventSchemas: 이벤트 이름 → 데이터 타입 매핑
 */
export type Events = {
  /** 쇼케이스 배치 생성 요청 (cron 자동 또는 어드민 수동) */
  "admin/showcase.generate-batch": {
    data: {
      /** 생성 대상 도시 목록 */
      cities: string[];
      /** 콘텐츠 노출 시작일 (ISO 8601) */
      startDate: string;
      /** 콘텐츠 노출 종료일 (ISO 8601) */
      endDate: string;
      /** AI 생성 힌트 프롬프트 (선택) */
      prompt?: string;
      /** 트리거 출처 */
      triggeredBy: "cron" | "manual";
    };
  };

  /** 단일 도시 쇼케이스 재생성 요청 (어드민 수동) */
  "admin/showcase.regenerate-city": {
    data: {
      /** 재생성 대상 도시명 */
      cityName: string;
      /** 콘텐츠 노출 시작일 (YYYY-MM-DD) */
      startDate: string;
      /** 콘텐츠 노출 종료일 (YYYY-MM-DD) */
      endDate: string;
      /** AI 생성 힌트 프롬프트 (선택) */
      prompt?: string;
    };
  };

  /** 쇼케이스 배치 생성 완료 알림 */
  "admin/showcase.batch-completed": {
    data: {
      /** 성공적으로 생성된 쇼케이스 수 */
      generatedCount: number;
      /** 생성 실패한 도시 목록 */
      failedCities: string[];
      /** 다음 자동 생성 예정일 (ISO 8601) */
      nextGenerationDate: string;
    };
  };
};
