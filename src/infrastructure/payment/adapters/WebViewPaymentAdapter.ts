import type {
  PaymentContext,
  PaymentEnvironment,
  PGResponse,
  IPGClient,
} from "@/domain/payment/types";
import type { IPaymentAdapter } from "./IPaymentAdapter";

/**
 * WebView 환경 결제 어댑터
 * 앱 내 WebView 환경에서의 결제 처리를 담당한다.
 * 내부적으로 IPGClient를 주입받아 실제 PG 통신을 위임한다.
 */
export class WebViewPaymentAdapter implements IPaymentAdapter {
  readonly environment: PaymentEnvironment = "WEBVIEW";
  private readonly pgClient: IPGClient;

  constructor(pgClient: IPGClient) {
    this.pgClient = pgClient;
  }

  /** WebView 환경 결제 요청 처리 */
  async requestPayment(context: PaymentContext): Promise<PGResponse> {
    try {
      const response = await this.pgClient.requestPayment({
        orderId: context.orderId,
        amount: context.amount,
        productName: `${context.hotelName} 숙박 예약`,
      });
      return response;
    } catch (error) {
      // PG 통신 실패 시 에러 응답 반환
      return {
        success: false,
        errorCode: "WEBVIEW_ADAPTER_ERROR",
        errorMessage:
          error instanceof Error
            ? error.message
            : "WebView 환경 결제 처리 중 알 수 없는 오류가 발생했습니다.",
      };
    }
  }

  /** 결제 검증 - 트랜잭션 ID로 결제 완료 여부 확인 */
  async verifyPayment(transactionId: string): Promise<boolean> {
    // MockPG 환경에서는 트랜잭션 ID가 존재하면 검증 성공으로 처리
    return transactionId.length > 0;
  }
}
