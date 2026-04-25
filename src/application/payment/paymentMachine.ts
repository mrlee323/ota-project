import { setup, assign, fromPromise, createMachine } from "xstate";
import type { PaymentContext, PGResponse } from "@/domain/payment/types";
import type { IPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";

// ─── 상태 머신 이벤트 타입 정의 ──────────────────────────────────────────────
type InitializeEvent = {
  type: "INITIALIZE";
  data: Omit<PaymentContext, "retryCount" | "transactionId" | "approvalNumber" | "errorCode" | "errorMessage">;
};

type StartPaymentEvent = { type: "START_PAYMENT" };

type PaymentResponseEvent = {
  type: "PAYMENT_RESPONSE";
  data: PGResponse;
};

type VerifyCompleteEvent = { type: "VERIFY_COMPLETE" };
type RetryEvent = { type: "RETRY" };
type TimeoutEvent = { type: "TIMEOUT" };

export type PaymentMachineEvent =
  | InitializeEvent
  | StartPaymentEvent
  | PaymentResponseEvent
  | VerifyCompleteEvent
  | RetryEvent
  | TimeoutEvent;

// ─── 상태 머신 입력 타입 (어댑터 주입) ──────────────────────────────────────
export interface PaymentMachineInput {
  adapter: IPaymentAdapter;
  timeoutMs?: number; // 타임아웃 시간 (기본값: 30000ms)
}

// ─── 초기 컨텍스트 ───────────────────────────────────────────────────────────
const initialContext: PaymentContext = {
  orderId: "",
  amount: 0,
  hotelName: "",
  checkIn: "",
  checkOut: "",
  guestName: "",
  environment: "PC",
  retryCount: 0,
};

// ─── 타임아웃 기본값 ─────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 30000;

// ─── XState v5 상태 머신 정의 ────────────────────────────────────────────────
export const paymentMachine = setup({
  types: {
    context: {} as PaymentContext,
    events: {} as PaymentMachineEvent,
    input: {} as PaymentMachineInput,
  },
  guards: {
    /** PROCESSING 상태에서 중복 START_PAYMENT 이벤트 차단 */
    isNotProcessing: ({ context: _ctx }, _params) => {
      // 이 guard는 PROCESSING 상태에서 START_PAYMENT 이벤트를 차단하기 위해 사용
      // PROCESSING 상태에서 호출되면 항상 false를 반환하여 전이를 막는다
      return false;
    },
  },
  actions: {
    /** INITIALIZE 이벤트 데이터로 컨텍스트 초기화 */
    assignInitData: assign({
      orderId: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.orderId;
      },
      amount: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.amount;
      },
      hotelName: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.hotelName;
      },
      checkIn: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.checkIn;
      },
      checkOut: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.checkOut;
      },
      guestName: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.guestName;
      },
      environment: ({ event }) => {
        const e = event as InitializeEvent;
        return e.data.environment;
      },
      retryCount: () => 0,
      transactionId: () => undefined,
      approvalNumber: () => undefined,
      errorCode: () => undefined,
      errorMessage: () => undefined,
    }),
    /** 결제 성공 응답 데이터를 컨텍스트에 기록 */
    assignSuccessResponse: assign({
      transactionId: ({ event }) => {
        const e = event as PaymentResponseEvent;
        if (e.data.success) return e.data.transactionId;
        return undefined;
      },
      approvalNumber: ({ event }) => {
        const e = event as PaymentResponseEvent;
        if (e.data.success) return e.data.approvalNumber;
        return undefined;
      },
      errorCode: () => undefined,
      errorMessage: () => undefined,
    }),
    /** 결제 실패 응답 데이터를 컨텍스트에 기록 */
    assignFailureResponse: assign({
      errorCode: ({ event }) => {
        const e = event as PaymentResponseEvent;
        if (!e.data.success) return e.data.errorCode;
        return undefined;
      },
      errorMessage: ({ event }) => {
        const e = event as PaymentResponseEvent;
        if (!e.data.success) return e.data.errorMessage;
        return undefined;
      },
      transactionId: () => undefined,
      approvalNumber: () => undefined,
    }),
    /** 타임아웃 실패 정보를 컨텍스트에 기록 */
    assignTimeoutError: assign({
      errorCode: () => "PAYMENT_TIMEOUT",
      errorMessage: () => "결제 처리 시간이 초과되었습니다.",
      transactionId: () => undefined,
      approvalNumber: () => undefined,
    }),
    /** 재시도 시 에러 정보 초기화 및 retryCount 증가 */
    assignRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
      errorCode: () => undefined,
      errorMessage: () => undefined,
      transactionId: () => undefined,
      approvalNumber: () => undefined,
    }),
  },
}).createMachine({
  id: "payment",
  initial: "IDLE",
  context: ({ input }) => ({
    ...initialContext,
    environment: input?.adapter?.environment ?? "PC",
  }),
  states: {
    /** 초기 상태 - 결제 정보 입력 대기 */
    IDLE: {
      on: {
        INITIALIZE: {
          target: "READY",
          actions: "assignInitData",
        },
      },
    },
    /** 결제 준비 완료 - 결제 시작 대기 */
    READY: {
      on: {
        START_PAYMENT: {
          target: "PROCESSING",
        },
      },
    },
    /** 결제 처리 중 - PG 응답 대기 */
    PROCESSING: {
      on: {
        // 중복 START_PAYMENT 이벤트는 guard로 차단
        START_PAYMENT: {
          guard: "isNotProcessing",
          target: "PROCESSING",
        },
        PAYMENT_RESPONSE: [
          {
            // 성공 응답 → VERIFYING 전이
            guard: ({ event }) => {
              const e = event as PaymentResponseEvent;
              return e.data.success === true;
            },
            target: "VERIFYING",
            actions: "assignSuccessResponse",
          },
          {
            // 실패 응답 → FAILED 전이
            target: "FAILED",
            actions: "assignFailureResponse",
          },
        ],
        TIMEOUT: {
          target: "FAILED",
          actions: "assignTimeoutError",
        },
      },
      // 타임아웃 처리: 설정된 시간 초과 시 FAILED로 전이
      after: {
        paymentTimeout: {
          target: "FAILED",
          actions: "assignTimeoutError",
        },
      },
    },
    /** 결제 검증 중 */
    VERIFYING: {
      on: {
        VERIFY_COMPLETE: {
          target: "SUCCESS",
        },
      },
    },
    /** 결제 성공 (최종 상태) */
    SUCCESS: {
      type: "final",
    },
    /** 결제 실패 - 재시도 가능 */
    FAILED: {
      on: {
        RETRY: {
          target: "READY",
          actions: "assignRetry",
        },
      },
    },
  },
});

// ─── 타임아웃 딜레이 설정 ────────────────────────────────────────────────────
// XState v5에서 동적 딜레이를 위해 머신에 delays 설정
export const createPaymentMachineWithConfig = (input: PaymentMachineInput) => {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return paymentMachine.provide({
    delays: {
      paymentTimeout: timeoutMs,
    },
  });
};
