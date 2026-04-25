import type {
  PaymentContext,
  PaymentEnvironment,
  PGResponse,
  IPGClient,
} from "@/domain/payment/types";
import { PCPaymentAdapter } from "./PCPaymentAdapter";
import { MobilePaymentAdapter } from "./MobilePaymentAdapter";
import { WebViewPaymentAdapter } from "./WebViewPaymentAdapter";

// ─── 결제 어댑터 인터페이스 ──────────────────────────────────────────────────
// 환경별(PC/Mobile/WebView) 결제 처리를 추상화하는 공통 인터페이스
export interface IPaymentAdapter {
  /** 어댑터가 담당하는 결제 환경 */
  readonly environment: PaymentEnvironment;

  /** 결제 요청 처리 */
  requestPayment(context: PaymentContext): Promise<PGResponse>;

  /** 결제 검증 */
  verifyPayment(transactionId: string): Promise<boolean>;
}

// ─── 어댑터 팩토리 함수 ──────────────────────────────────────────────────────
// 환경에 따라 적절한 어댑터를 생성하여 반환한다 (OCP 준수)
export function createPaymentAdapter(
  environment: PaymentEnvironment,
  pgClient: IPGClient
): IPaymentAdapter {
  switch (environment) {
    case "PC":
      return new PCPaymentAdapter(pgClient);
    case "MOBILE":
      return new MobilePaymentAdapter(pgClient);
    case "WEBVIEW":
      return new WebViewPaymentAdapter(pgClient);
    default: {
      // 타입 안전성: 모든 환경이 처리되었는지 컴파일 타임에 검증
      const _exhaustive: never = environment;
      throw new Error(`지원하지 않는 결제 환경입니다: ${_exhaustive}`);
    }
  }
}
