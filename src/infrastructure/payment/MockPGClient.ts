import type {
  IPGClient,
  PaymentRequestParams,
  PGResponse,
} from "@/domain/payment/types";

/**
 * MockPG 클라이언트
 * 실제 PG와 동일한 인터페이스를 구현하며, 실패율과 지연시간을 조절하여 결제 시뮬레이션을 수행한다.
 */
export class MockPGClient implements IPGClient {
  private readonly failureRate: number; // 실패 확률 (0~100)
  private readonly delayMs: number; // 응답 지연 시간 (밀리초)

  constructor(failureRate: number = 0, delayMs: number = 0) {
    this.failureRate = Math.max(0, Math.min(100, failureRate));
    this.delayMs = Math.max(0, delayMs);
  }

  /** 설정된 지연시간 후 실패율에 따라 성공/실패 응답을 반환한다 */
  async requestPayment(params: PaymentRequestParams): Promise<PGResponse> {
    // 지연시간만큼 대기
    if (this.delayMs > 0) {
      await this.delay(this.delayMs);
    }

    // 실패율에 따라 성공/실패 결정
    const shouldFail = Math.random() * 100 < this.failureRate;

    if (shouldFail) {
      return {
        success: false,
        errorCode: "PG_PAYMENT_FAILED",
        errorMessage: `결제 실패: 주문 ${params.orderId} 처리 중 오류가 발생했습니다.`,
      };
    }

    return {
      success: true,
      transactionId: this.generateUUID(),
      approvalNumber: this.generateApprovalNumber(),
    };
  }

  /** UUID v4 형식의 트랜잭션 ID 생성 */
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (char) => {
        const random = (Math.random() * 16) | 0;
        const value = char === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
      }
    );
  }

  /** 승인 번호 생성 (8자리 숫자) */
  private generateApprovalNumber(): string {
    return String(Math.floor(10000000 + Math.random() * 90000000));
  }

  /** 지연 유틸리티 */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
