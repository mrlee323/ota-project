import { describe, it, expect, vi } from "vitest";
import { createActor } from "xstate";

// ─── 도메인 레이어 ───────────────────────────────────────────────────────────
import type {
  PaymentEnvironment,
  PGResponse,
  PaymentContext,
} from "@/domain/payment/types";

// ─── 인프라 레이어 ───────────────────────────────────────────────────────────
import { MockPGClient } from "@/infrastructure/payment/MockPGClient";
import { createPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";
import type { IPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";

// ─── 애플리케이션 레이어 ─────────────────────────────────────────────────────
import {
  createPaymentMachineWithConfig,
  type PaymentMachineInput,
} from "@/application/payment/paymentMachine";

// ─── 테스트 헬퍼 ─────────────────────────────────────────────────────────────

/** INITIALIZE 이벤트에 사용할 기본 결제 데이터 */
const defaultInitData = {
  orderId: "ORD-INTEG-001",
  amount: 250000,
  hotelName: "서울 그랜드 호텔",
  checkIn: "2025-08-01T00:00:00.000Z",
  checkOut: "2025-08-03T00:00:00.000Z",
  guestName: "홍길동",
  environment: "PC" as PaymentEnvironment,
};

/** MockPG + 어댑터 + 상태 머신 액터를 한 번에 생성하는 헬퍼 */
function createIntegrationActor(options: {
  environment: PaymentEnvironment;
  failureRate?: number;
  delayMs?: number;
  timeoutMs?: number;
}) {
  const pgClient = new MockPGClient(
    options.failureRate ?? 0,
    options.delayMs ?? 0,
  );
  const adapter = createPaymentAdapter(options.environment, pgClient);
  const input: PaymentMachineInput = {
    adapter,
    timeoutMs: options.timeoutMs ?? 999_999_999,
  };
  const machine = createPaymentMachineWithConfig(input);
  const actor = createActor(machine, { input });
  actor.start();
  return { actor, adapter, pgClient };
}

describe("결제 통합 테스트: 어댑터 + MockPG + 상태 머신 연동", () => {
  /**
   * 정상 결제 전체 흐름 (IDLE → READY → PROCESSING → VERIFYING → SUCCESS)
   * MockPGClient(실패율 0%) → 어댑터 → 상태 머신 연동 검증
   * Validates: Requirements 3.10, 4.5
   */
  describe("정상 결제 전체 흐름", () => {
    it("MockPG(성공) + PC 어댑터로 전체 결제 흐름을 완료한다", async () => {
      const { actor, adapter } = createIntegrationActor({
        environment: "PC",
        failureRate: 0,
      });

      // IDLE → READY
      expect(actor.getSnapshot().value).toBe("IDLE");
      actor.send({ type: "INITIALIZE", data: defaultInitData });
      expect(actor.getSnapshot().value).toBe("READY");

      // READY → PROCESSING
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 어댑터를 통해 실제 MockPG 결제 요청 수행
      const response = await adapter.requestPayment(
        actor.getSnapshot().context as PaymentContext,
      );
      expect(response.success).toBe(true);

      // PROCESSING → VERIFYING (성공 응답 전달)
      actor.send({ type: "PAYMENT_RESPONSE", data: response });
      expect(actor.getSnapshot().value).toBe("VERIFYING");

      // 성공 데이터가 컨텍스트에 기록되었는지 확인
      if (response.success) {
        const ctx = actor.getSnapshot().context as PaymentContext;
        expect(ctx.transactionId).toBe(response.transactionId);
        expect(ctx.approvalNumber).toBe(response.approvalNumber);
      }

      // VERIFYING → SUCCESS
      actor.send({ type: "VERIFY_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("SUCCESS");

      actor.stop();
    });
  });

  /**
   * 실패 결제 흐름 (실패율 100% MockPG)
   * Validates: Requirements 3.10
   */
  describe("실패 결제 흐름", () => {
    it("MockPG(실패율 100%)로 결제 실패 후 FAILED 상태로 전이한다", async () => {
      const { actor, adapter } = createIntegrationActor({
        environment: "PC",
        failureRate: 100,
      });

      actor.send({ type: "INITIALIZE", data: defaultInitData });
      actor.send({ type: "START_PAYMENT" });
      expect(actor.getSnapshot().value).toBe("PROCESSING");

      // 실패율 100% MockPG를 통한 결제 요청
      const response = await adapter.requestPayment(
        actor.getSnapshot().context as PaymentContext,
      );
      expect(response.success).toBe(false);

      // PROCESSING → FAILED
      actor.send({ type: "PAYMENT_RESPONSE", data: response });
      expect(actor.getSnapshot().value).toBe("FAILED");

      // 실패 사유가 컨텍스트에 기록되었는지 확인
      if (!response.success) {
        const ctx = actor.getSnapshot().context as PaymentContext;
        expect(ctx.errorCode).toBe(response.errorCode);
        expect(ctx.errorMessage).toBe(response.errorMessage);
      }

      actor.stop();
    });

    it("실패 후 RETRY로 재시도하여 성공할 수 있다", async () => {
      // 첫 시도: 실패율 100%
      const failPg = new MockPGClient(100, 0);
      const failAdapter = createPaymentAdapter("PC", failPg);
      const input: PaymentMachineInput = {
        adapter: failAdapter,
        timeoutMs: 999_999_999,
      };
      const machine = createPaymentMachineWithConfig(input);
      const actor = createActor(machine, { input });
      actor.start();

      actor.send({ type: "INITIALIZE", data: defaultInitData });
      actor.send({ type: "START_PAYMENT" });

      const failResponse = await failAdapter.requestPayment(
        actor.getSnapshot().context as PaymentContext,
      );
      actor.send({ type: "PAYMENT_RESPONSE", data: failResponse });
      expect(actor.getSnapshot().value).toBe("FAILED");

      // RETRY → READY
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("READY");
      expect(actor.getSnapshot().context.retryCount).toBe(1);

      // 재시도: 성공율 100% 어댑터로 결제
      const successPg = new MockPGClient(0, 0);
      const successAdapter = createPaymentAdapter("PC", successPg);

      actor.send({ type: "START_PAYMENT" });
      const successResponse = await successAdapter.requestPayment(
        actor.getSnapshot().context as PaymentContext,
      );
      actor.send({ type: "PAYMENT_RESPONSE", data: successResponse });
      expect(actor.getSnapshot().value).toBe("VERIFYING");

      actor.send({ type: "VERIFY_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("SUCCESS");

      actor.stop();
    });
  });

  /**
   * 환경 전환 시 어댑터 자동 교체 검증
   * 팩토리 함수가 환경에 맞는 어댑터를 올바르게 생성하는지 확인
   * Validates: Requirements 4.5, 3.10
   */
  describe("환경별 어댑터 자동 교체", () => {
    const environments: PaymentEnvironment[] = ["PC", "MOBILE", "WEBVIEW"];

    environments.forEach((env) => {
      it(`${env} 환경에서 올바른 어댑터가 생성되고 결제 흐름이 동작한다`, async () => {
        const { actor, adapter } = createIntegrationActor({
          environment: env,
          failureRate: 0,
        });

        // 어댑터 환경이 올바르게 설정되었는지 확인
        expect(adapter.environment).toBe(env);

        // 상태 머신 컨텍스트의 환경도 일치하는지 확인
        const initDataWithEnv = { ...defaultInitData, environment: env };
        actor.send({ type: "INITIALIZE", data: initDataWithEnv });
        expect(actor.getSnapshot().context.environment).toBe(env);

        // 해당 환경 어댑터로 전체 결제 흐름 수행
        actor.send({ type: "START_PAYMENT" });
        const response = await adapter.requestPayment(
          actor.getSnapshot().context as PaymentContext,
        );
        expect(response.success).toBe(true);

        actor.send({ type: "PAYMENT_RESPONSE", data: response });
        expect(actor.getSnapshot().value).toBe("VERIFYING");

        actor.send({ type: "VERIFY_COMPLETE" });
        expect(actor.getSnapshot().value).toBe("SUCCESS");

        actor.stop();
      });
    });

    it("동일 MockPG로 환경만 변경하면 다른 어댑터가 생성된다", () => {
      const pgClient = new MockPGClient(0, 0);

      const pcAdapter = createPaymentAdapter("PC", pgClient);
      const mobileAdapter = createPaymentAdapter("MOBILE", pgClient);
      const webviewAdapter = createPaymentAdapter("WEBVIEW", pgClient);

      // 각 어댑터의 환경이 올바르게 설정되었는지 확인
      expect(pcAdapter.environment).toBe("PC");
      expect(mobileAdapter.environment).toBe("MOBILE");
      expect(webviewAdapter.environment).toBe("WEBVIEW");

      // 서로 다른 인스턴스인지 확인
      expect(pcAdapter).not.toBe(mobileAdapter);
      expect(mobileAdapter).not.toBe(webviewAdapter);
      expect(pcAdapter).not.toBe(webviewAdapter);
    });
  });

  /**
   * 어댑터의 verifyPayment 연동 검증
   * Validates: Requirements 4.5
   */
  describe("어댑터 verifyPayment 연동", () => {
    it("성공한 트랜잭션 ID로 검증이 통과한다", async () => {
      const { actor, adapter } = createIntegrationActor({
        environment: "PC",
        failureRate: 0,
      });

      actor.send({ type: "INITIALIZE", data: defaultInitData });
      actor.send({ type: "START_PAYMENT" });

      const response = await adapter.requestPayment(
        actor.getSnapshot().context as PaymentContext,
      );

      if (response.success) {
        // 어댑터의 verifyPayment로 트랜잭션 검증
        const isValid = await adapter.verifyPayment(response.transactionId);
        expect(isValid).toBe(true);
      }

      actor.stop();
    });
  });
});
