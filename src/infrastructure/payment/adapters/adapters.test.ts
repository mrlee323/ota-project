import { describe, it, expect } from "vitest";
import { PCPaymentAdapter } from "./PCPaymentAdapter";
import { MobilePaymentAdapter } from "./MobilePaymentAdapter";
import { WebViewPaymentAdapter } from "./WebViewPaymentAdapter";
import { createPaymentAdapter } from "./IPaymentAdapter";
import { MockPGClient } from "../MockPGClient";
import type { PaymentContext, IPGClient, PGResponse } from "@/domain/payment/types";

// 테스트용 결제 컨텍스트
const testContext: PaymentContext = {
  orderId: "ORDER-TEST-001",
  amount: 200000,
  hotelName: "서울 그랜드 호텔",
  checkIn: "2025-07-01T15:00:00Z",
  checkOut: "2025-07-03T11:00:00Z",
  guestName: "홍길동",
  environment: "PC",
  retryCount: 0,
};

describe("IPaymentAdapter - 어댑터 인터페이스 및 팩토리", () => {
  describe("createPaymentAdapter 팩토리 함수", () => {
    it("PC 환경에 대해 PCPaymentAdapter를 생성한다", () => {
      const pgClient = new MockPGClient(0, 0);
      const adapter = createPaymentAdapter("PC", pgClient);

      expect(adapter.environment).toBe("PC");
      expect(adapter).toBeInstanceOf(PCPaymentAdapter);
    });

    it("MOBILE 환경에 대해 MobilePaymentAdapter를 생성한다", () => {
      const pgClient = new MockPGClient(0, 0);
      const adapter = createPaymentAdapter("MOBILE", pgClient);

      expect(adapter.environment).toBe("MOBILE");
      expect(adapter).toBeInstanceOf(MobilePaymentAdapter);
    });

    it("WEBVIEW 환경에 대해 WebViewPaymentAdapter를 생성한다", () => {
      const pgClient = new MockPGClient(0, 0);
      const adapter = createPaymentAdapter("WEBVIEW", pgClient);

      expect(adapter.environment).toBe("WEBVIEW");
      expect(adapter).toBeInstanceOf(WebViewPaymentAdapter);
    });
  });
});

describe("PCPaymentAdapter", () => {
  it("environment가 PC이다", () => {
    const adapter = new PCPaymentAdapter(new MockPGClient(0, 0));
    expect(adapter.environment).toBe("PC");
  });

  it("결제 요청 성공 시 PGResponse 성공 응답을 반환한다", async () => {
    const adapter = new PCPaymentAdapter(new MockPGClient(0, 0));
    const response = await adapter.requestPayment(testContext);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.transactionId).toBeDefined();
      expect(response.approvalNumber).toBeDefined();
    }
  });

  it("결제 요청 실패 시 PGResponse 실패 응답을 반환한다", async () => {
    const adapter = new PCPaymentAdapter(new MockPGClient(100, 0));
    const response = await adapter.requestPayment(testContext);

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.errorCode).toBeDefined();
      expect(response.errorMessage).toBeDefined();
    }
  });

  it("PG 클라이언트 예외 발생 시 에러 응답을 반환한다", async () => {
    // PG 클라이언트가 예외를 던지는 경우를 시뮬레이션
    const failingClient: IPGClient = {
      async requestPayment(): Promise<PGResponse> {
        throw new Error("네트워크 연결 실패");
      },
    };
    const adapter = new PCPaymentAdapter(failingClient);
    const response = await adapter.requestPayment(testContext);

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.errorCode).toBe("PC_ADAPTER_ERROR");
      expect(response.errorMessage).toBe("네트워크 연결 실패");
    }
  });

  it("유효한 transactionId로 verifyPayment가 true를 반환한다", async () => {
    const adapter = new PCPaymentAdapter(new MockPGClient(0, 0));
    const result = await adapter.verifyPayment("txn-12345");
    expect(result).toBe(true);
  });

  it("빈 transactionId로 verifyPayment가 false를 반환한다", async () => {
    const adapter = new PCPaymentAdapter(new MockPGClient(0, 0));
    const result = await adapter.verifyPayment("");
    expect(result).toBe(false);
  });
});

describe("MobilePaymentAdapter", () => {
  it("environment가 MOBILE이다", () => {
    const adapter = new MobilePaymentAdapter(new MockPGClient(0, 0));
    expect(adapter.environment).toBe("MOBILE");
  });

  it("결제 요청 성공 시 PGResponse 성공 응답을 반환한다", async () => {
    const adapter = new MobilePaymentAdapter(new MockPGClient(0, 0));
    const response = await adapter.requestPayment({
      ...testContext,
      environment: "MOBILE",
    });

    expect(response.success).toBe(true);
  });

  it("PG 클라이언트 예외 발생 시 MOBILE_ADAPTER_ERROR를 반환한다", async () => {
    const failingClient: IPGClient = {
      async requestPayment(): Promise<PGResponse> {
        throw new Error("모바일 네트워크 오류");
      },
    };
    const adapter = new MobilePaymentAdapter(failingClient);
    const response = await adapter.requestPayment(testContext);

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.errorCode).toBe("MOBILE_ADAPTER_ERROR");
    }
  });
});

describe("WebViewPaymentAdapter", () => {
  it("environment가 WEBVIEW이다", () => {
    const adapter = new WebViewPaymentAdapter(new MockPGClient(0, 0));
    expect(adapter.environment).toBe("WEBVIEW");
  });

  it("결제 요청 성공 시 PGResponse 성공 응답을 반환한다", async () => {
    const adapter = new WebViewPaymentAdapter(new MockPGClient(0, 0));
    const response = await adapter.requestPayment({
      ...testContext,
      environment: "WEBVIEW",
    });

    expect(response.success).toBe(true);
  });

  it("PG 클라이언트 예외 발생 시 WEBVIEW_ADAPTER_ERROR를 반환한다", async () => {
    const failingClient: IPGClient = {
      async requestPayment(): Promise<PGResponse> {
        throw new Error("WebView 브릿지 오류");
      },
    };
    const adapter = new WebViewPaymentAdapter(failingClient);
    const response = await adapter.requestPayment(testContext);

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.errorCode).toBe("WEBVIEW_ADAPTER_ERROR");
    }
  });
});
