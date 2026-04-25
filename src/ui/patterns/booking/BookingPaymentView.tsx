"use client";

import { useEffect } from "react";
import type { PaymentState } from "@/domain/payment/types";
import { usePayment } from "@/application/payment/usePayment";
import { formatPrice } from "@/ui/patterns/hotel/RatePlanItem";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

interface BookingPaymentViewProps {
  /** 객실 타입명 */
  roomName: string;
  /** 체크인 날짜 (YYYY-MM-DD) */
  checkIn: string;
  /** 체크아웃 날짜 (YYYY-MM-DD) */
  checkOut: string;
  /** 투숙객 이름 */
  guestName: string;
  /** 결제 금액 */
  price: number;
  /** 이전으로 버튼 클릭 핸들러 */
  onBack: () => void;
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

/** 결제 화면 — 예약 요약 + 상태별 결제 UI */
export function BookingPaymentView({
  roomName,
  checkIn,
  checkOut,
  guestName,
  price,
  onBack,
}: BookingPaymentViewProps) {
  const { state, send, context } = usePayment();

  // 현재 상태값 추출
  const currentState = (
    typeof state.value === "string" ? state.value : Object.keys(state.value)[0]
  ) as PaymentState;

  // VERIFYING 상태 자동 완료 처리
  useEffect(() => {
    if (currentState === "VERIFYING") {
      send({ type: "VERIFY_COMPLETE" });
    }
  }, [currentState, send]);

  const isProcessing = currentState === "PROCESSING";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* 예약 정보 요약 */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold text-gray-900">예약 정보</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">객실명</dt>
            <dd className="font-medium text-gray-900">{roomName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">체크인</dt>
            <dd className="font-medium text-gray-900">{checkIn}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">체크아웃</dt>
            <dd className="font-medium text-gray-900">{checkOut}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">투숙객</dt>
            <dd className="font-medium text-gray-900">{guestName}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <dt className="text-gray-500">결제 금액</dt>
            <dd className="font-bold text-brand">{formatPrice(price)}</dd>
          </div>
        </dl>
      </section>

      {/* 결제 실패 에러 메시지 */}
      {currentState === "FAILED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">결제에 실패했습니다</p>
          {context.errorMessage && (
            <p className="mt-1 text-red-600">{context.errorMessage}</p>
          )}
        </div>
      )}

      {/* 결제 처리 중 로딩 인디케이터 */}
      {(isProcessing || currentState === "VERIFYING") && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
          <p className="text-sm text-gray-500">결제를 처리하고 있습니다…</p>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        {/* 이전으로 버튼 — PROCESSING 상태에서 비활성화 */}
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing || currentState === "VERIFYING"}
          className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          이전으로
        </button>

        {/* 상태별 액션 버튼 */}
        {currentState === "READY" && (
          <button
            type="button"
            onClick={() => send({ type: "START_PAYMENT" })}
            className="flex-1 rounded-lg bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            결제하기
          </button>
        )}

        {(isProcessing || currentState === "VERIFYING") && (
          <button
            type="button"
            disabled
            className="flex-1 rounded-lg bg-brand py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          >
            처리 중…
          </button>
        )}

        {currentState === "FAILED" && (
          <button
            type="button"
            onClick={() => send({ type: "RETRY" })}
            className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            재시도
          </button>
        )}
      </div>
    </div>
  );
}
