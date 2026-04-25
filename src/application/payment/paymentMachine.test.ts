import { describe, it, expect, vi } from "vitest";
import { createActor } from "xstate";
import {
  createPaymentMachineWithConfig,
  type PaymentMachineInput,
} from "./paymentMachine";
import type { IPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";
import type { PaymentContext, PGResponse } from "@/domain/payment/types";

// ─── 테스트 헬퍼 ─────────────────────────────────────────────────────────────

/** 테스트용 Mock 어댑터 생성 */
function createTestAdapter(
  overrides?: Partial<IPaymentAdapter>,
): IPaymentAdapter {
  return {
    environment: "PC",
    requestPayment: async (_ctx: PaymentContext): Promise<PGResponse> => ({
      success: true,
      transactionId: "tx-test-001",
      approvalNumber: "12345678",
    }),
    verifyPayment: async (_txId: string): Promise<boolean> => true,
    ...overrides,
  };
}

/** 테스트용 INITIALIZE 이벤트 데이터 */
const initData = {
  orderId: "ORD-TEST-001",
  amount: 150000,
  hotelName: "그랜드 호텔",
  checkIn: "2025-07-01T00:00:00.000Z",
  checkOut: "2025-07-03T00:00:00.000Z",
  guestName: "김테스트",
  environment: "PC" as const,
};

/** 상태 머신 액터를 생성하고 시작하는 헬퍼 */
function createTestActor(input?: Partial<PaymentMachineInput>) {
  const adapter = input?.adapter ?? createTestAdapter();
  const machineInput: PaymentMachineInput = {
    adapter,
    timeoutMs: input?.timeoutMs ?? 999_999_999, // 기본적으로 타임아웃 비활성화
  };
  const machine = createPaymentMachineWithConfig(machineInput);
  const actor = createActor(machine, { input: machineInput });
  actor.start();
  return actor;
}

describe("결제 상태 머신 Unit Tests", () => {
  /**
   * 정상 결제 흐름 전이 검증
   * IDLE → READY → PROCESSING → VERIFYING → SUCCESS
   * Requirements: 7.1
   */
  describe("정상 결제 흐름", () => {
    it("IDLE → READY → PROCESSING → VERIFYING → SUCCESS 순서로 전이한다", () => {
      const actor = createTestActor();

      // 초기 상태: IDLE
      expect(actor.getSnapshot().value).toBe("IDLE");

      // INITIALIZE → READY
      actor.send({ type: "INITIALIZE", data: initData });
      expect(actor.getSnapshot().value).toBe("READY");

      // 컨텍스트에 초기화 데이터가 반영되었는지 확인
      const ctx = actor.getSnapshot().context;
      expect(ctx.orderId).toBe("ORD-TEST-001");
      expect(ctx.amount).toBe(150000);
      expect(ctx.hotelName).toBe("그랜드 호텔");
      expect(ctx.guestName).toBe("김테스트");
      expect(ctx.retryCount).toBe(0);

      // START_PAYMENT → PROCESSING
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // PAYMENT_RESPONSE (성공) → VERIFYING
      actor.send({
        type: "PAYMENT_RESPONSE",
        data: {
          success: true,
          transactionId: "tx-success-001",
          approvalNumber: "99887766",
        },
      });
      expect(actor.getSnapshot().value).toBe("VERIFYING");

      // 성공 응답 데이터가 컨텍스트에 기록되었는지 확인
      const verifyCtx = actor.getSnapshot().context;
      expect(verifyCtx.transactionId).toBe("tx-success-001");
      expect(verifyCtx.approvalNumber).toBe("99887766");

      // VERIFY_COMPLETE → SUCCESS
      actor.send({ type: "VERIFY_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("SUCCESS");

      actor.stop();
    });
  });

  /**
   * PROCESSING 상태에서 타임아웃 시 FAILED 전이 검증
   * Requirements: 7.2
   */
  describe("타임아웃 처리", () => {
    it("PROCESSING 상태에서 타임아웃 시 FAILED로 전이한다", () => {
      vi.useFakeTimers();

      const actor = createTestActor({ timeoutMs: 3000 });

      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 타임아웃 시간 경과
      vi.advanceTimersByTime(3000);

      expect(actor.getSnapshot().value).toBe("FAILED");

      // 타임아웃 에러 정보가 컨텍스트에 기록되었는지 확인
      const ctx = actor.getSnapshot().context;
      expect(ctx.errorCode).toBe("PAYMENT_TIMEOUT");
      expect(ctx.errorMessage).toBe("결제 처리 시간이 초과되었습니다.");

      actor.stop();
      vi.useRealTimers();
    });

    it("PROCESSING 상태에서 TIMEOUT 이벤트로 FAILED 전이한다", () => {
      const actor = createTestActor();

      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 명시적 TIMEOUT 이벤트
      actor.send({ type: "TIMEOUT" });

      expect(actor.getSnapshot().value).toBe("FAILED");
      expect(actor.getSnapshot().context.errorCode).toBe("PAYMENT_TIMEOUT");

      actor.stop();
    });
  });

  /**
   * PROCESSING 상태에서 중복 START_PAYMENT 무시 검증
   * Requirements: 7.3
   */
  describe("중복 이벤트 차단", () => {
    it("PROCESSING 상태에서 중복 START_PAYMENT 이벤트를 무시한다", () => {
      const actor = createTestActor();

      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 중복 START_PAYMENT 전송 - 상태가 변하지 않아야 함
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 여러 번 보내도 여전히 PROCESSING
      actor.send({ type: "START_PAYMENT" });
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      actor.stop();
    });
  });

  /**
   * 결제 실패 시 FAILED 전이 및 실패 사유 기록 검증
   * Requirements: 7.4
   */
  describe("결제 실패 처리", () => {
    it("PAYMENT_RESPONSE 실패 시 FAILED로 전이하고 실패 사유를 기록한다", () => {
      const actor = createTestActor();

      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });

      // 실패 응답
      actor.send({
        type: "PAYMENT_RESPONSE",
        data: {
          success: false,
          errorCode: "INSUFFICIENT_BALANCE",
          errorMessage: "잔액이 부족합니다.",
        },
      });

      expect(actor.getSnapshot().value).toBe("FAILED");

      const ctx = actor.getSnapshot().context;
      expect(ctx.errorCode).toBe("INSUFFICIENT_BALANCE");
      expect(ctx.errorMessage).toBe("잔액이 부족합니다.");
      // 실패 시 트랜잭션 정보는 없어야 함
      expect(ctx.transactionId).toBeUndefined();
      expect(ctx.approvalNumber).toBeUndefined();

      actor.stop();
    });
  });

  /**
   * FAILED → RETRY → READY 복귀 검증
   * Requirements: 7.5
   */
  describe("재시도 흐름", () => {
    it("FAILED 상태에서 RETRY로 READY 상태로 복귀한다", () => {
      const actor = createTestActor();

      // 실패 상태까지 진행
      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });
      actor.send({
        type: "PAYMENT_RESPONSE",
        data: {
          success: false,
          errorCode: "PG_ERROR",
          errorMessage: "PG 오류",
        },
      });
      expect(actor.getSnapshot().value).toBe("FAILED");

      // RETRY → READY
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("READY");

      // retryCount가 증가했는지 확인
      expect(actor.getSnapshot().context.retryCount).toBe(1);
      // 에러 정보가 초기화되었는지 확인
      expect(actor.getSnapshot().context.errorCode).toBeUndefined();
      expect(actor.getSnapshot().context.errorMessage).toBeUndefined();

      actor.stop();
    });

    it("재시도 후 다시 정상 결제 흐름을 진행할 수 있다", () => {
      const actor = createTestActor();

      // 실패 → 재시도
      actor.send({ type: "INITIALIZE", data: initData });
      actor.send({ type: "START_PAYMENT" });
      actor.send({
        type: "PAYMENT_RESPONSE",
        data: { success: false, errorCode: "ERR", errorMessage: "실패" },
      });
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("READY");
      expect(actor.getSnapshot().context.retryCount).toBe(1);

      // 재시도 후 정상 흐름
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      actor.send({
        type: "PAYMENT_RESPONSE",
        data: {
          success: true,
          transactionId: "tx-retry-001",
          approvalNumber: "55667788",
        },
      });
      expect(actor.getSnapshot().value).toBe("VERIFYING");

      actor.send({ type: "VERIFY_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("SUCCESS");

      actor.stop();
    });
  });

  /**
   * 각 테스트는 독립적으로 실행 가능해야 한다
   * Requirements: 7.6
   */
  describe("테스트 독립성", () => {
    it("각 테스트는 새로운 액터로 독립적으로 실행된다", () => {
      // 첫 번째 액터
      const actor1 = createTestActor();
      actor1.send({ type: "INITIALIZE", data: initData });
      actor1.send({ type: "START_PAYMENT" });
      expect(actor1.getSnapshot().value).toBe("PROCESSING");
      actor1.stop();

      // 두 번째 액터 - 첫 번째와 독립적으로 IDLE에서 시작
      const actor2 = createTestActor();
      expect(actor2.getSnapshot().value).toBe("IDLE");
      actor2.stop();
    });
  });
});
