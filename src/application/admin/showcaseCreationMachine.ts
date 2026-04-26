import { setup, assign, fromPromise } from "xstate";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import type { ShowcaseCreationDraft } from "@/domain/admin/showcaseContent";
import type { ShowcaseService } from "@/infrastructure/admin/mockShowcaseService";

// ─── 상태 머신 컨텍스트 타입 정의 ────────────────────────────────────────────

/** 에러 발생 시 재시도할 상태 */
export type FailedState =
  | "generatingTitle"
  | "generatingImage"
  | "generatingHotels"
  | "saving"
  | null;

/** 쇼케이스 생성 상태 머신 컨텍스트 */
export interface ShowcaseCreationContext {
  /** 선택된 도시명 */
  cityName: string;
  /** 노출 시작일 (ISO 날짜 문자열) */
  startDate: string;
  /** 노출 종료일 (ISO 날짜 문자열) */
  endDate: string;
  /** 생성된 타이틀 */
  title: string;
  /** 생성된 이미지 URL */
  imageUrl: string;
  /** 생성된 호텔 카드 목록 (전체) */
  hotels: ShowcaseHotelCard[];
  /** 선택된 호텔 ID 목록 */
  selectedHotelIds: string[];
  /** 에러 메시지 */
  errorMessage: string;
  /** 에러 발생 시 재시도할 상태 추적 */
  failedState: FailedState;
  /** 주입된 서비스 참조 */
  showcaseService: ShowcaseService;
}

// ─── 상태 머신 이벤트 타입 정의 ──────────────────────────────────────────────

export type ShowcaseCreationEvent =
  | { type: "START" }
  | { type: "SUBMIT_CITY"; cityName: string }
  | { type: "SUBMIT_PERIOD"; startDate: string; endDate: string }
  | { type: "CONFIRM" }
  | { type: "UPDATE_TITLE"; title: string }
  | { type: "REGENERATE_IMAGE" }
  | { type: "TOGGLE_HOTEL"; hotelId: string }
  | { type: "SELECT_ALL_HOTELS" }
  | { type: "DESELECT_ALL_HOTELS" }
  | { type: "BACK" }
  | { type: "RETRY" }
  | { type: "RESET" };

// ─── 상태 머신 입력 타입 (서비스 주입) ──────────────────────────────────────

/** 서비스 주입을 위한 입력 타입 */
export interface ShowcaseCreationMachineInput {
  showcaseService: ShowcaseService;
}

// ─── XState v5 상태 머신 정의 ────────────────────────────────────────────────

export const showcaseCreationMachine = setup({
  types: {
    context: {} as ShowcaseCreationContext,
    events: {} as ShowcaseCreationEvent,
    input: {} as ShowcaseCreationMachineInput,
  },
  actors: {
    /** 타이틀 생성 비동기 액터 */
    generateTitle: fromPromise<string, { cityName: string; service: ShowcaseService }>(
      async ({ input }) => input.service.generateTitle(input.cityName),
    ),
    /** 이미지 생성 비동기 액터 */
    generateImage: fromPromise<
      string,
      { cityName: string; title: string; service: ShowcaseService }
    >(async ({ input }) => input.service.generateImage(input.cityName, input.title)),
    /** 호텔 목록 생성 비동기 액터 */
    generateHotels: fromPromise<
      ShowcaseHotelCard[],
      { cityName: string; service: ShowcaseService }
    >(async ({ input }) => input.service.generateHotels(input.cityName)),
    /** 쇼케이스 저장 비동기 액터 */
    saveShowcase: fromPromise<
      unknown,
      { draft: ShowcaseCreationDraft; service: ShowcaseService }
    >(async ({ input }) => input.service.createShowcase(input.draft)),
  },
  guards: {
    /** RETRY 시 failedState가 generatingTitle인지 확인 */
    isFailedAtTitle: ({ context }) => context.failedState === "generatingTitle",
    /** RETRY 시 failedState가 generatingImage인지 확인 */
    isFailedAtImage: ({ context }) => context.failedState === "generatingImage",
    /** RETRY 시 failedState가 generatingHotels인지 확인 */
    isFailedAtHotels: ({ context }) => context.failedState === "generatingHotels",
    /** RETRY 시 failedState가 saving인지 확인 */
    isFailedAtSaving: ({ context }) => context.failedState === "saving",
  },
}).createMachine({
  id: "showcaseCreation",
  initial: "idle",
  context: ({ input }) => ({
    cityName: "",
    startDate: "",
    endDate: "",
    title: "",
    imageUrl: "",
    hotels: [],
    selectedHotelIds: [],
    errorMessage: "",
    failedState: null,
    showcaseService: input.showcaseService,
  }),
  on: {
    /** 모든 상태에서 RESET 이벤트로 idle 복귀 */
    RESET: {
      target: ".idle",
      actions: assign(({ context }) => ({
        cityName: "",
        startDate: "",
        endDate: "",
        title: "",
        imageUrl: "",
        hotels: [],
        selectedHotelIds: [],
        errorMessage: "",
        failedState: null,
        showcaseService: context.showcaseService,
      })),
    },
  },
  states: {
    /** 초기 상태 */
    idle: {
      on: {
        START: { target: "inputtingCity" },
      },
    },

    /** 도시명 입력 단계 */
    inputtingCity: {
      on: {
        SUBMIT_CITY: {
          target: "settingPeriod",
          actions: assign({
            cityName: ({ event }) => event.cityName,
          }),
        },
      },
    },

    /** 노출 기간 설정 단계 */
    settingPeriod: {
      on: {
        BACK: { target: "inputtingCity" },
        SUBMIT_PERIOD: {
          target: "generatingTitle",
          actions: assign({
            startDate: ({ event }) => event.startDate,
            endDate: ({ event }) => event.endDate,
          }),
        },
      },
    },

    /** 타이틀 생성 중 - Mock Service invoke */
    generatingTitle: {
      invoke: {
        src: "generateTitle",
        input: ({ context }) => ({
          cityName: context.cityName,
          service: context.showcaseService,
        }),
        onDone: {
          target: "editingTitle",
          actions: assign({
            title: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) =>
              (event.error as Error)?.message ?? "타이틀 생성 중 오류가 발생했습니다.",
            failedState: () => "generatingTitle" as const,
          }),
        },
      },
    },

    /** 타이틀 편집 단계 - 수정 가능 */
    editingTitle: {
      on: {
        BACK: { target: "settingPeriod" },
        UPDATE_TITLE: {
          actions: assign({
            title: ({ event }) => event.title,
          }),
        },
        CONFIRM: { target: "generatingImage" },
      },
    },

    /** 이미지 생성 중 - Mock Service invoke */
    generatingImage: {
      invoke: {
        src: "generateImage",
        input: ({ context }) => ({
          cityName: context.cityName,
          title: context.title,
          service: context.showcaseService,
        }),
        onDone: {
          target: "reviewingImage",
          actions: assign({
            imageUrl: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) =>
              (event.error as Error)?.message ?? "이미지 생성 중 오류가 발생했습니다.",
            failedState: () => "generatingImage" as const,
          }),
        },
      },
    },

    /** 이미지 확인 단계 - 재생성 가능 */
    reviewingImage: {
      on: {
        BACK: { target: "editingTitle" },
        CONFIRM: { target: "generatingHotels" },
        REGENERATE_IMAGE: { target: "generatingImage" },
      },
    },

    /** 호텔 목록 생성 중 - Mock Service invoke */
    generatingHotels: {
      invoke: {
        src: "generateHotels",
        input: ({ context }) => ({
          cityName: context.cityName,
          service: context.showcaseService,
        }),
        onDone: {
          target: "selectingHotels",
          actions: assign({
            hotels: ({ event }) => event.output,
            /** 생성 시 전체 선택 기본값 */
            selectedHotelIds: ({ event }) =>
              (event.output as ShowcaseHotelCard[]).map((h) => h.id),
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) =>
              (event.error as Error)?.message ?? "호텔 목록 생성 중 오류가 발생했습니다.",
            failedState: () => "generatingHotels" as const,
          }),
        },
      },
    },

    /** 호텔 선택 단계 - 개별/전체 선택·해제 */
    selectingHotels: {
      on: {
        BACK: { target: "reviewingImage" },
        TOGGLE_HOTEL: {
          actions: assign({
            selectedHotelIds: ({ context, event }) => {
              const { hotelId } = event;
              if (context.selectedHotelIds.includes(hotelId)) {
                return context.selectedHotelIds.filter((id) => id !== hotelId);
              }
              return [...context.selectedHotelIds, hotelId];
            },
          }),
        },
        SELECT_ALL_HOTELS: {
          actions: assign({
            selectedHotelIds: ({ context }) => context.hotels.map((h) => h.id),
          }),
        },
        DESELECT_ALL_HOTELS: {
          actions: assign({
            selectedHotelIds: () => [],
          }),
        },
        CONFIRM: { target: "saving" },
      },
    },

    /** 저장 중 - 선택된 호텔만 포함하여 저장 */
    saving: {
      invoke: {
        src: "saveShowcase",
        input: ({ context }) => ({
          draft: {
            cityName: context.cityName,
            title: context.title,
            imageUrl: context.imageUrl,
            hotels: context.hotels.filter((h) =>
              context.selectedHotelIds.includes(h.id),
            ),
            startDate: context.startDate,
            endDate: context.endDate,
          } satisfies ShowcaseCreationDraft,
          service: context.showcaseService,
        }),
        onDone: {
          target: "done",
        },
        onError: {
          target: "error",
          actions: assign({
            errorMessage: ({ event }) =>
              (event.error as Error)?.message ?? "저장 중 오류가 발생했습니다.",
            failedState: () => "saving" as const,
          }),
        },
      },
    },

    /** 완료 (최종 상태) */
    done: {
      type: "final",
    },

    /** 에러 상태 - failedState 기반 RETRY로 해당 상태 재실행 */
    error: {
      on: {
        RETRY: [
          { guard: "isFailedAtTitle", target: "generatingTitle" },
          { guard: "isFailedAtImage", target: "generatingImage" },
          { guard: "isFailedAtHotels", target: "generatingHotels" },
          { guard: "isFailedAtSaving", target: "saving" },
        ],
      },
    },
  },
});
