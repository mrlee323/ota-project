"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PaymentEnvironment, PaymentState } from "@/domain/payment/types";
import { PaymentProvider, usePayment } from "@/application/payment/usePayment";

// ─── 상태별 색상 매핑 ────────────────────────────────────────────────────────
const STATE_COLORS: Record<PaymentState, { bg: string; text: string; label: string }> = {
  IDLE: { bg: "bg-gray-100", text: "text-gray-700", label: "대기" },
  READY: { bg: "bg-blue-100", text: "text-blue-700", label: "준비 완료" },
  PROCESSING: { bg: "bg-amber-100", text: "text-amber-700", label: "처리 중" },
  VERIFYING: { bg: "bg-purple-100", text: "text-purple-700", label: "검증 중" },
  SUCCESS: { bg: "bg-green-100", text: "text-green-700", label: "성공" },
  FAILED: { bg: "bg-red-100", text: "text-red-700", label: "실패" },
};

// ─── 상태 전이 로그 항목 타입 ────────────────────────────────────────────────
interface TransitionLog {
  timestamp: string;
  from: string;
  to: string;
}

// ─── 환경 옵션 ───────────────────────────────────────────────────────────────
const ENVIRONMENTS: { value: PaymentEnvironment; label: string }[] = [
  { value: "PC", label: "PC" },
  { value: "MOBILE", label: "Mobile" },
  { value: "WEBVIEW", label: "WebView" },
];

// ─── 내부 컨텐츠 컴포넌트 (usePayment 훅 사용) ──────────────────────────────
function PaymentDemoContent() {
  const { state, send, context } = usePayment();
  const [logs, setLogs] = useState<TransitionLog[]>([]);
  const prevStateRef = useRef<string>("");

  // 현재 상태값 추출
  const currentState = (
    typeof state.value === "string" ? state.value : Object.keys(state.value)[0]
  ) as PaymentState;

  // 상태 전이 감지 및 로그 기록
  useEffect(() => {
    if (prevStateRef.current && prevStateRef.current !== currentState) {
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString("ko-KR"),
          from: prevStateRef.current,
          to: currentState,
        },
        ...prev,
      ]);
    }
    prevStateRef.current = currentState;
  }, [currentState]);

  // 폼 상태 관리
  const [hotelName, setHotelName] = useState("그랜드 하얏트 서울");
  const [checkIn, setCheckIn] = useState("2025-08-01");
  const [checkOut, setCheckOut] = useState("2025-08-03");
  const [guestName, setGuestName] = useState("홍길동");
  const [amount, setAmount] = useState(350000);

  // 결제 초기화 핸들러
  const handleInitialize = useCallback(() => {
    send({
      type: "INITIALIZE",
      data: {
        orderId: `ORD-${Date.now()}`,
        amount,
        hotelName,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guestName,
        environment: context.environment || "PC",
      },
    });
  }, [send, amount, hotelName, checkIn, checkOut, guestName, context.environment]);

  // 결제 시작 핸들러
  const handleStartPayment = useCallback(() => {
    send({ type: "START_PAYMENT" });
  }, [send]);

  // 결제 검증 완료 핸들러
  const handleVerifyComplete = useCallback(() => {
    send({ type: "VERIFY_COMPLETE" });
  }, [send]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    send({ type: "RETRY" });
  }, [send]);

  // 로그 초기화
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const stateColor = STATE_COLORS[currentState] ?? STATE_COLORS.IDLE;

  return (
    <div className="space-y-6">
      {/* 현재 상태 시각화 */}
      <section className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          현재 결제 상태
        </h2>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-lg font-bold ${stateColor.bg} ${stateColor.text}`}
          >
            {currentState}
          </span>
          <span className="text-sm text-gray-500">{stateColor.label}</span>
        </div>

        {/* 상태 진행 바 */}
        <div className="mt-4 flex gap-1">
          {(Object.keys(STATE_COLORS) as PaymentState[]).map((s) => {
            const isActive = s === currentState;
            const color = STATE_COLORS[s];
            return (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  isActive ? color.bg.replace("100", "400") : "bg-gray-200"
                }`}
                title={s}
              />
            );
          })}
        </div>
      </section>

      {/* 컨텍스트 정보 표시 */}
      {currentState !== "IDLE" && (
        <section className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            결제 컨텍스트
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">주문 ID</dt>
            <dd className="font-mono">{context.orderId}</dd>
            <dt className="text-gray-500">호텔명</dt>
            <dd>{context.hotelName}</dd>
            <dt className="text-gray-500">금액</dt>
            <dd>{context.amount?.toLocaleString()}원</dd>
            <dt className="text-gray-500">환경</dt>
            <dd>{context.environment}</dd>
            <dt className="text-gray-500">재시도 횟수</dt>
            <dd>{context.retryCount}</dd>
            {context.transactionId && (
              <>
                <dt className="text-gray-500">트랜잭션 ID</dt>
                <dd className="font-mono text-green-600">{context.transactionId}</dd>
              </>
            )}
            {context.approvalNumber && (
              <>
                <dt className="text-gray-500">승인 번호</dt>
                <dd className="font-mono text-green-600">{context.approvalNumber}</dd>
              </>
            )}
            {context.errorCode && (
              <>
                <dt className="text-gray-500">에러 코드</dt>
                <dd className="font-mono text-red-600">{context.errorCode}</dd>
              </>
            )}
            {context.errorMessage && (
              <>
                <dt className="text-gray-500">에러 메시지</dt>
                <dd className="text-red-600">{context.errorMessage}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* 호텔 예약 정보 입력 폼 */}
      <section className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          호텔 예약 정보
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">
              호텔명
            </label>
            <input
              id="hotelName"
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              disabled={currentState !== "IDLE"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">
              투숙객
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={currentState !== "IDLE"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
              체크인
            </label>
            <input
              id="checkIn"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              disabled={currentState !== "IDLE"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">
              체크아웃
            </label>
            <input
              id="checkOut"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              disabled={currentState !== "IDLE"}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              결제 금액 (원)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={currentState !== "IDLE"}
              min={0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* 액션 버튼 */}
      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleInitialize}
          disabled={currentState !== "IDLE"}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          결제 초기화
        </button>
        <button
          type="button"
          onClick={handleStartPayment}
          disabled={currentState !== "READY"}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          결제 시작
        </button>
        <button
          type="button"
          onClick={handleVerifyComplete}
          disabled={currentState !== "VERIFYING"}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          검증 완료
        </button>
        <button
          type="button"
          onClick={handleRetry}
          disabled={currentState !== "FAILED"}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          재시도
        </button>
      </section>

      {/* 상태 전이 이력 로그 */}
      <section className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            상태 전이 로그
          </h2>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">아직 상태 전이가 없습니다.</p>
        ) : (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log, i) => {
              const toColor = STATE_COLORS[log.to as PaymentState];
              return (
                <li
                  key={`${log.timestamp}-${i}`}
                  className="flex items-center gap-2 text-sm font-mono"
                >
                  <span className="text-gray-400 text-xs w-20 shrink-0">
                    {log.timestamp}
                  </span>
                  <span className="text-gray-500">{log.from}</span>
                  <span className="text-gray-300">→</span>
                  <span className={toColor?.text ?? "text-gray-700"}>
                    {log.to}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── 메인 데모 컴포넌트 (PaymentProvider 래퍼) ───────────────────────────────
// 실패율, 지연시간, 환경 설정은 Provider 외부에서 관리한다.
export default function PaymentDemo() {
  const [environment, setEnvironment] = useState<PaymentEnvironment>("PC");
  const [failureRate, setFailureRate] = useState(0);
  const [delayMs, setDelayMs] = useState(1000);

  // Provider key: 설정 변경 시 상태 머신을 재생성하기 위한 키
  const providerKey = `${environment}-${failureRate}-${delayMs}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        결제 흐름 데모
      </h1>

      {/* 시뮬레이션 설정 (Provider 외부) */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          시뮬레이션 설정
        </h2>

        {/* 환경 선택 */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            결제 환경
          </legend>
          <div className="flex gap-4">
            {ENVIRONMENTS.map((env) => (
              <label
                key={env.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="environment"
                  value={env.value}
                  checked={environment === env.value}
                  onChange={() => setEnvironment(env.value)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">{env.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* 실패율 슬라이더 */}
        <div>
          <label htmlFor="failureRate" className="block text-sm font-medium text-gray-700">
            실패율: {failureRate}%
          </label>
          <input
            id="failureRate"
            type="range"
            min={0}
            max={100}
            value={failureRate}
            onChange={(e) => setFailureRate(Number(e.target.value))}
            className="mt-1 w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 지연시간 입력 */}
        <div>
          <label htmlFor="delayMs" className="block text-sm font-medium text-gray-700">
            응답 지연시간 (ms)
          </label>
          <input
            id="delayMs"
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(Math.max(0, Number(e.target.value)))}
            min={0}
            step={100}
            className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </section>

      {/* PaymentProvider로 감싸서 내부 컴포넌트에 상태 공급 */}
      <PaymentProvider
        key={providerKey}
        environment={environment}
        failureRate={failureRate}
        delayMs={delayMs}
      >
        <PaymentDemoContent />
      </PaymentProvider>
    </div>
  );
}
