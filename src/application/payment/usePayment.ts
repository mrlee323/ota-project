"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  createElement,
} from "react";
import { useMachine } from "@xstate/react";
import type { PaymentContext, PaymentEnvironment } from "@/domain/payment/types";
import { createPaymentMachineWithConfig } from "@/application/payment/paymentMachine";
import { createPaymentAdapter } from "@/infrastructure/payment/adapters/IPaymentAdapter";
import { MockPGClient } from "@/infrastructure/payment/MockPGClient";
import type { Actor, AnyStateMachine, StateFrom } from "xstate";

// ─── PaymentProvider 설정 타입 ───────────────────────────────────────────────
export interface PaymentProviderProps {
  children: ReactNode;
  /** 결제 환경 (PC, MOBILE, WEBVIEW) */
  environment: PaymentEnvironment;
  /** MockPG 실패율 (0~100, 기본값: 0) */
  failureRate?: number;
  /** MockPG 지연시간 (밀리초, 기본값: 0) */
  delayMs?: number;
  /** 결제 타임아웃 (밀리초, 기본값: 30000) */
  timeoutMs?: number;
}

// ─── usePayment 반환 타입 ────────────────────────────────────────────────────
export interface UsePaymentReturn {
  /** 현재 상태 머신 스냅샷 */
  state: StateFrom<AnyStateMachine>;
  /** 이벤트 전송 함수 */
  send: Actor<AnyStateMachine>["send"];
  /** 결제 컨텍스트 데이터 */
  context: PaymentContext;
}

// ─── React Context 정의 ─────────────────────────────────────────────────────
const PaymentContext_ = createContext<UsePaymentReturn | null>(null);

// ─── usePayment 훅 ──────────────────────────────────────────────────────────
// PaymentProvider 내부에서만 사용 가능. 외부 호출 시 에러를 throw한다.
export function usePayment(): UsePaymentReturn {
  const value = useContext(PaymentContext_);
  if (value === null) {
    throw new Error(
      "usePayment은 PaymentProvider 내부에서만 사용할 수 있습니다. " +
        "컴포넌트를 PaymentProvider로 감싸주세요."
    );
  }
  return value;
}

// ─── PaymentProvider 컴포넌트 ────────────────────────────────────────────────
// 결제 상태 머신을 구동하고 하위 컴포넌트에 상태를 공급한다.
export function PaymentProvider({
  children,
  environment,
  failureRate = 0,
  delayMs = 0,
  timeoutMs = 30000,
}: PaymentProviderProps) {
  // 환경에 맞는 어댑터를 생성 (팩토리 함수 활용)
  const adapter = useMemo(
    () => {
      const pgClient = new MockPGClient(failureRate, delayMs);
      return createPaymentAdapter(environment, pgClient);
    },
    [environment, failureRate, delayMs]
  );

  // 타임아웃 설정이 반영된 상태 머신 생성
  const machine = useMemo(
    () => createPaymentMachineWithConfig({ adapter, timeoutMs }),
    [adapter, timeoutMs]
  );

  // useMachine에 input 전달 (상태 머신이 input 타입을 요구)
  const machineInput = useMemo(
    () => ({ adapter, timeoutMs }),
    [adapter, timeoutMs]
  );

  // @xstate/react v4의 useMachine: [state, send, actor] 반환
  const [state, send] = useMachine(machine, { input: machineInput });

  const value: UsePaymentReturn = useMemo(
    () => ({
      state,
      send,
      context: state.context as PaymentContext,
    }),
    [state, send]
  );

  return createElement(PaymentContext_.Provider, { value }, children);
}
