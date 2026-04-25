import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createActor } from "xstate";
import {
  createPaymentMachineWithConfig,
  type PaymentMachineEvent,
} from "./paymentMachine";
import type { IPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";
import type { PaymentContext, PGResponse } from "@/domain/payment/types";

// ─── 허용된 상태 전이 맵 ─────────────────────────────────────────────────────
// 각 상태에서 전이 가능한 다음 상태 목록 (설계 문서 기반)
const VALID_TRANSITIONS: Record<string, string[]> = {
  IDLE: ["IDLE", "READY"],
  READY: ["READY", "PROCESSING"],
  PROCESSING: ["PROCESSING", "VERIFYING", "FAILED"],
  VERIFYING: ["VERIFYING", "SUCCESS"],
  SUCCESS: ["SUCCESS"], // 최종 상태
  FAILED: ["FAILED", "READY"],
};

// ─── 테스트용 Mock 어댑터 ────────────────────────────────────────────────────
const createMockAdapter = (): IPaymentAdapter => ({
  environment: "PC",
  requestPayment: async (_ctx: PaymentContext): Promise<PGResponse> => ({
    success: true,
    transactionId: "tx-test",
    approvalNumber: "99999999",
  }),
  verifyPayment: async (_txId: string): Promise<boolean> => true,
});

// ─── 이벤트 생성기 (Arbitrary) ───────────────────────────────────────────────
// 상태 머신에 전달할 수 있는 모든 유효한 이벤트를 생성
const paymentEventArb: fc.Arbitrary<PaymentMachineEvent> = fc.oneof(
  // INITIALIZE 이벤트
  fc.constant<PaymentMachineEvent>({
    type: "INITIALIZE",
    data: {
      orderId: "ORD-001",
      amount: 50000,
      hotelName: "테스트 호텔",
      checkIn: "2025-06-01T00:00:00.000Z",
      checkOut: "2025-06-02T00:00:00.000Z",
      guestName: "테스트 사용자",
      environment: "PC",
    },
  }),
  // START_PAYMENT 이벤트
  fc.constant<PaymentMachineEvent>({ type: "START_PAYMENT" }),
  // PAYMENT_RESPONSE 성공 이벤트
  fc.constant<PaymentMachineEvent>({
    type: "PAYMENT_RESPONSE",
    data: { success: true, transactionId: "tx-prop", approvalNumber: "11111111" },
  }),
  // PAYMENT_RESPONSE 실패 이벤트
  fc.constant<PaymentMachineEvent>({
    type: "PAYMENT_RESPONSE",
    data: { success: false, errorCode: "PG_ERROR", errorMessage: "결제 실패" },
  }),
  // VERIFY_COMPLETE 이벤트
  fc.constant<PaymentMachineEvent>({ type: "VERIFY_COMPLETE" }),
  // RETRY 이벤트
  fc.constant<PaymentMachineEvent>({ type: "RETRY" }),
  // TIMEOUT 이벤트
  fc.constant<PaymentMachineEvent>({ type: "TIMEOUT" }),
);

describe("결제 상태 머신 Property Tests", () => {
  /**
   * Property 2: 상태 전이 불변성
   * 임의의 유효한 이벤트 시퀀스에 대해 상태 머신은 정의된 전이 규칙만 따라야 한다.
   * fast-check로 임의의 PaymentEvent 시퀀스를 생성하여 허용되지 않은 상태 전이가 발생하지 않음을 검증한다.
   *
   * **Validates: Requirements 3.1, 7.7**
   */
  it("Property 2: 임의의 이벤트 시퀀스에 대해 정의된 전이 규칙만 따라야 한다 (상태 전이 불변성)", () => {
    fc.assert(
      fc.property(
        fc.array(paymentEventArb, { minLength: 1, maxLength: 30 }),
        (events) => {
          const adapter = createMockAdapter();
          // 타임아웃을 매우 크게 설정하여 after 딜레이가 테스트 중 발동하지 않도록 함
          const input = { adapter, timeoutMs: 999_999_999 };
          const machine = createPaymentMachineWithConfig(input);
          const actor = createActor(machine, { input });
          actor.start();

          let previousState = String(actor.getSnapshot().value);

          for (const event of events) {
            actor.send(event);
            const currentState = String(actor.getSnapshot().value);

            // 현재 상태가 이전 상태에서 허용된 전이 목록에 포함되어야 한다
            const allowedNextStates = VALID_TRANSITIONS[previousState];
            expect(
              allowedNextStates,
              `알 수 없는 상태: ${previousState}`,
            ).toBeDefined();
            expect(
              allowedNextStates.includes(currentState),
              `허용되지 않은 전이: ${previousState} → ${currentState} (이벤트: ${event.type}). 허용된 전이: [${allowedNextStates.join(", ")}]`,
            ).toBe(true);

            previousState = currentState;
          }

          actor.stop();
        },
      ),
      { numRuns: 300 },
    );
  });
});
