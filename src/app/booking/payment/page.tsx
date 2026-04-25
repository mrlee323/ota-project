"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  paymentPageParamsSchema,
  type PaymentPageParams,
} from "@/domain/booking/schemas";
import type { PaymentState } from "@/domain/payment/types";
import { PaymentProvider, usePayment } from "@/application/payment/usePayment";
import { BookingPaymentView } from "@/ui/patterns/booking/BookingPaymentView";

// ─── 내부 결제 컴포넌트 ──────────────────────────────────────────────────────
// PaymentProvider 내부에서 usePayment() 훅을 사용하기 위해 분리된 컴포넌트
function PaymentInner({ params }: { params: PaymentPageParams }) {
  const router = useRouter();
  const { state, send, context } = usePayment();

  // 현재 상태값 추출
  const currentState = (
    typeof state.value === "string" ? state.value : Object.keys(state.value)[0]
  ) as PaymentState;

  // 마운트 시 INITIALIZE 이벤트로 예약 데이터 주입
  useEffect(() => {
    send({
      type: "INITIALIZE",
      data: {
        orderId: `BOOK-${Date.now()}`,
        amount: params.price,
        hotelName: params.roomName,
        checkIn: new Date(params.checkIn).toISOString(),
        checkOut: new Date(params.checkOut).toISOString(),
        guestName: params.guestName,
        environment: "PC" as const,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SUCCESS 상태 도달 시 /booking/complete로 자동 이동
  useEffect(() => {
    if (currentState === "SUCCESS") {
      const completeParams = new URLSearchParams({
        roomId: params.roomId,
        roomName: params.roomName,
        price: String(params.price),
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guestName: params.guestName,
        transactionId: context.transactionId ?? "",
        approvalNumber: context.approvalNumber ?? "",
      });
      router.push(`/booking/complete?${completeParams.toString()}`);
    }
  }, [currentState, context.transactionId, context.approvalNumber, params, router]);

  // 이전으로 — 예약 확인 페이지로 복귀
  const handleBack = () => {
    const backParams = new URLSearchParams({
      roomId: params.roomId,
      roomName: params.roomName,
      price: String(params.price),
    });
    router.push(`/booking/confirm?${backParams.toString()}`);
  };

  return (
    <BookingPaymentView
      roomName={params.roomName}
      checkIn={params.checkIn}
      checkOut={params.checkOut}
      guestName={params.guestName}
      price={params.price}
      onBack={handleBack}
    />
  );
}

// ─── 결제 페이지 (외부 컴포넌트) ─────────────────────────────────────────────
// 쿼리 파라미터 검증 후 PaymentProvider로 감싸서 내부 컴포넌트 렌더링
export default function BookingPaymentPage() {
  const searchParams = useSearchParams();

  // 쿼리 파라미터를 객체로 변환 후 Zod 스키마로 검증
  const raw = Object.fromEntries(searchParams.entries());
  const result = paymentPageParamsSchema.safeParse(raw);

  // 검증 실패 시 오류 메시지 + 예약 확인 페이지 링크 표시
  if (!result.success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-red-600">
          유효하지 않은 접근입니다
        </p>
        <p className="mt-2 text-sm text-gray-500">
          필수 예약 데이터가 누락되었습니다.
        </p>
        <Link
          href="/booking/confirm"
          className="mt-4 rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          예약 확인 페이지로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
        결제
      </h1>
      <PaymentProvider environment="PC" failureRate={0} delayMs={1500}>
        <PaymentInner params={result.data} />
      </PaymentProvider>
    </div>
  );
}
