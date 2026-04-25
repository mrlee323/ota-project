import { z } from "zod";

// ─── 결제 상태 (6개 상태) ────────────────────────────────────────────────────
export type PaymentState =
  | "IDLE"
  | "READY"
  | "PROCESSING"
  | "VERIFYING"
  | "SUCCESS"
  | "FAILED";

// ─── 결제 이벤트 ─────────────────────────────────────────────────────────────
export type PaymentEvent =
  | "INITIALIZE"
  | "START_PAYMENT"
  | "PAYMENT_RESPONSE"
  | "VERIFY_COMPLETE"
  | "RETRY"
  | "TIMEOUT";

// ─── 결제 환경 ───────────────────────────────────────────────────────────────
export type PaymentEnvironment = "PC" | "MOBILE" | "WEBVIEW";

// ─── 결제 컨텍스트 ───────────────────────────────────────────────────────────
export interface PaymentContext {
  orderId: string; // 주문 고유 ID
  amount: number; // 결제 금액 (원)
  hotelName: string; // 호텔명
  checkIn: string; // 체크인 날짜 (ISO 8601)
  checkOut: string; // 체크아웃 날짜 (ISO 8601)
  guestName: string; // 투숙객 이름
  environment: PaymentEnvironment; // 결제 환경
  transactionId?: string; // PG 트랜잭션 ID (성공 시)
  approvalNumber?: string; // 승인 번호 (성공 시)
  errorCode?: string; // 에러 코드 (실패 시)
  errorMessage?: string; // 에러 메시지 (실패 시)
  retryCount: number; // 재시도 횟수
}

// ─── PG 응답 (판별 유니온) ───────────────────────────────────────────────────
export type PGResponse =
  | { success: true; transactionId: string; approvalNumber: string }
  | { success: false; errorCode: string; errorMessage: string };

// ─── 결제 요청 파라미터 ──────────────────────────────────────────────────────
export interface PaymentRequestParams {
  orderId: string;
  amount: number;
  productName: string;
}

// ─── PG 클라이언트 인터페이스 ────────────────────────────────────────────────
export interface IPGClient {
  requestPayment(params: PaymentRequestParams): Promise<PGResponse>;
}

// ─── Zod 스키마: PaymentContext 런타임 유효성 검증 ───────────────────────────
export const paymentContextSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  hotelName: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guestName: z.string().min(1),
  environment: z.enum(["PC", "MOBILE", "WEBVIEW"]),
  transactionId: z.string().optional(),
  approvalNumber: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  retryCount: z.number().int().min(0),
});

/** PaymentContext 런타임 유효성 검증 함수 */
export function validatePaymentContext(
  data: unknown
): { success: true; data: PaymentContext } | { success: false; error: z.ZodError } {
  const result = paymentContextSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as PaymentContext };
  }
  return { success: false, error: result.error };
}
