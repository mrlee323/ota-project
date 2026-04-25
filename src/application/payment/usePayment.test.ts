import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { usePayment, PaymentProvider } from "./usePayment";

// ─── 테스트 헬퍼 ─────────────────────────────────────────────────────────────

/** PaymentProvider 래퍼 생성 */
function createWrapper(props?: {
  environment?: "PC" | "MOBILE" | "WEBVIEW";
  failureRate?: number;
  delayMs?: number;
  timeoutMs?: number;
}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(PaymentProvider, {
      environment: props?.environment ?? "PC",
      failureRate: props?.failureRate ?? 0,
      delayMs: props?.delayMs ?? 0,
      timeoutMs: props?.timeoutMs ?? 999_999_999,
      children,
    });
  };
}

/** 테스트용 INITIALIZE 이벤트 데이터 */
const initData = {
  orderId: "ORD-HOOK-001",
  amount: 200000,
  hotelName: "테스트 호텔",
  checkIn: "2025-08-01T00:00:00.000Z",
  checkOut: "2025-08-03T00:00:00.000Z",
  guestName: "홍길동",
  environment: "PC" as const,
};

describe("usePayment 훅 및 PaymentProvider", () => {
  /**
   * PaymentProvider 외부에서 usePayment 호출 시 에러 throw 검증
   * Requirements: 5.4
   */
  it("PaymentProvider 외부에서 호출 시 명확한 에러를 throw한다", () => {
    expect(() => {
      renderHook(() => usePayment());
    }).toThrow("usePayment은 PaymentProvider 내부에서만 사용할 수 있습니다");
  });

  /**
   * usePayment 훅이 state, send, context를 반환하는지 검증
   * Requirements: 5.2
   */
  it("state, send, context를 반환한다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toBeDefined();
    expect(result.current.send).toBeInstanceOf(Function);
    expect(result.current.context).toBeDefined();
  });

  /**
   * 초기 상태가 IDLE인지 검증
   * Requirements: 5.1
   */
  it("초기 상태가 IDLE이다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.value).toBe("IDLE");
  });

  /**
   * send로 이벤트를 전송하여 상태 전이가 동작하는지 검증
   * Requirements: 5.1, 5.2
   */
  it("send로 INITIALIZE 이벤트를 전송하면 READY로 전이한다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.send({ type: "INITIALIZE", data: initData });
    });

    expect(result.current.state.value).toBe("READY");
    expect(result.current.context.orderId).toBe("ORD-HOOK-001");
    expect(result.current.context.amount).toBe(200000);
  });

  /**
   * PaymentEnvironment에 따라 적절한 어댑터가 선택되는지 검증
   * Requirements: 5.5
   */
  it("MOBILE 환경으로 설정하면 context.environment가 MOBILE이다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper({ environment: "MOBILE" }),
    });

    // 머신 초기 컨텍스트에서 환경이 반영됨
    expect(result.current.context.environment).toBe("MOBILE");
  });

  it("WEBVIEW 환경으로 설정하면 context.environment가 WEBVIEW이다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper({ environment: "WEBVIEW" }),
    });

    expect(result.current.context.environment).toBe("WEBVIEW");
  });

  /**
   * PaymentProvider를 통해 하위 컴포넌트에 상태가 공급되는지 검증
   * Requirements: 5.3
   */
  it("PaymentProvider 내부에서 정상적으로 상태를 공급받는다", () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: createWrapper(),
    });

    // 초기 컨텍스트 기본값 확인
    expect(result.current.context.retryCount).toBe(0);
    expect(result.current.context.orderId).toBe("");
    expect(result.current.context.amount).toBe(0);
  });
});
