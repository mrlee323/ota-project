import { describe, it, expect } from "vitest";
import { MockPGClient } from "./MockPGClient";
import type { PaymentRequestParams, PGResponse } from "@/domain/payment/types";

// 테스트용 결제 요청 파라미터
const testParams: PaymentRequestParams = {
  orderId: "ORDER-001",
  amount: 150000,
  productName: "서울 호텔 1박",
};

describe("MockPGClient", () => {
  describe("실패율 0% - 항상 성공 응답 반환", () => {
    it("성공 응답을 반환한다", async () => {
      const client = new MockPGClient(0, 0);

      // 여러 번 호출하여 항상 성공하는지 검증
      for (let i = 0; i < 10; i++) {
        const response = await client.requestPayment(testParams);
        expect(response.success).toBe(true);
      }
    });

    it("성공 응답에 transactionId와 approvalNumber가 포함된다", async () => {
      const client = new MockPGClient(0, 0);
      const response = await client.requestPayment(testParams);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.transactionId).toBeDefined();
        expect(typeof response.transactionId).toBe("string");
        expect(response.transactionId.length).toBeGreaterThan(0);

        expect(response.approvalNumber).toBeDefined();
        expect(typeof response.approvalNumber).toBe("string");
        expect(response.approvalNumber.length).toBe(8);
      }
    });
  });

  describe("실패율 100% - 항상 실패 응답 반환", () => {
    it("실패 응답을 반환한다", async () => {
      const client = new MockPGClient(100, 0);

      // 여러 번 호출하여 항상 실패하는지 검증
      for (let i = 0; i < 10; i++) {
        const response = await client.requestPayment(testParams);
        expect(response.success).toBe(false);
      }
    });

    it("실패 응답에 errorCode와 errorMessage가 포함된다", async () => {
      const client = new MockPGClient(100, 0);
      const response = await client.requestPayment(testParams);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.errorCode).toBeDefined();
        expect(typeof response.errorCode).toBe("string");
        expect(response.errorCode.length).toBeGreaterThan(0);

        expect(response.errorMessage).toBeDefined();
        expect(typeof response.errorMessage).toBe("string");
        expect(response.errorMessage.length).toBeGreaterThan(0);
      }
    });
  });

  describe("지연시간 설정 검증", () => {
    it("설정된 지연시간이 실제 응답 시간에 반영된다", async () => {
      const delayMs = 100;
      const client = new MockPGClient(0, delayMs);

      const start = Date.now();
      await client.requestPayment(testParams);
      const elapsed = Date.now() - start;

      // 지연시간 이상 소요되었는지 검증 (약간의 오차 허용)
      expect(elapsed).toBeGreaterThanOrEqual(delayMs - 10);
    });

    it("지연시간 0일 때 즉시 응답한다", async () => {
      const client = new MockPGClient(0, 0);

      const start = Date.now();
      await client.requestPayment(testParams);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("응답 구조 PGResponse 타입 일치 검증", () => {
    it("성공 응답이 PGResponse 성공 타입 구조와 일치한다", async () => {
      const client = new MockPGClient(0, 0);
      const response: PGResponse = await client.requestPayment(testParams);

      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("transactionId");
      expect(response).toHaveProperty("approvalNumber");
      // 실패 필드가 없어야 한다
      expect(response).not.toHaveProperty("errorCode");
      expect(response).not.toHaveProperty("errorMessage");
    });

    it("실패 응답이 PGResponse 실패 타입 구조와 일치한다", async () => {
      const client = new MockPGClient(100, 0);
      const response: PGResponse = await client.requestPayment(testParams);

      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("errorCode");
      expect(response).toHaveProperty("errorMessage");
      // 성공 필드가 없어야 한다
      expect(response).not.toHaveProperty("transactionId");
      expect(response).not.toHaveProperty("approvalNumber");
    });
  });
});
