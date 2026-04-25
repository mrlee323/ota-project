import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CouponInput } from "./CouponInput";

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function renderCouponInput(
  overrides: Partial<{
    onApply: (code: string) => Promise<{ discount: number } | null>;
    onSuccess: (code: string, discount: number) => void;
    appliedCoupon: string;
    onRemove: () => void;
  }> = {},
) {
  const onApply = overrides.onApply ?? vi.fn().mockResolvedValue(null);
  const onSuccess = overrides.onSuccess ?? vi.fn();
  const props = {
    onApply,
    onSuccess,
    appliedCoupon: overrides.appliedCoupon,
    onRemove: overrides.onRemove,
  };
  const result = render(<CouponInput {...props} />);
  return { ...result, onApply, onSuccess };
}

// ─── 테스트 ──────────────────────────────────────────────────────────────────

describe("CouponInput", () => {
  // ─── 기본 렌더링 ─────────────────────────────────────────────────────────

  it("쿠폰 코드 입력 필드와 적용 버튼을 표시한다", () => {
    renderCouponInput();
    expect(screen.getByLabelText("쿠폰 코드")).toBeTruthy();
    expect(screen.getByLabelText("쿠폰 적용")).toBeTruthy();
  });

  it("입력이 비어있으면 적용 버튼이 비활성화된다", () => {
    renderCouponInput();
    const btn = screen.getByLabelText("쿠폰 적용") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ─── 유효한 쿠폰 ────────────────────────────────────────────────────────

  it("유효한 쿠폰 적용 시 성공 메시지를 표시하고 onSuccess를 호출한다", async () => {
    const onApply = vi.fn().mockResolvedValue({ discount: 5000 });
    const onSuccess = vi.fn();
    renderCouponInput({ onApply, onSuccess });

    fireEvent.change(screen.getByLabelText("쿠폰 코드"), {
      target: { value: "SAVE5000" },
    });
    fireEvent.click(screen.getByLabelText("쿠폰 적용"));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("쿠폰이 적용되었습니다");
    });
    expect(onSuccess).toHaveBeenCalledWith("SAVE5000", 5000);
  });

  // ─── 무효한 쿠폰 ────────────────────────────────────────────────────────

  it("무효한 쿠폰 코드 입력 시 오류 메시지를 표시한다", async () => {
    const onApply = vi.fn().mockResolvedValue(null);
    renderCouponInput({ onApply });

    fireEvent.change(screen.getByLabelText("쿠폰 코드"), {
      target: { value: "INVALID" },
    });
    fireEvent.click(screen.getByLabelText("쿠폰 적용"));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("유효하지 않은 쿠폰 코드입니다");
    });
  });

  it("쿠폰 적용 중 오류 발생 시 오류 메시지를 표시한다", async () => {
    const onApply = vi.fn().mockRejectedValue(new Error("network error"));
    renderCouponInput({ onApply });

    fireEvent.change(screen.getByLabelText("쿠폰 코드"), {
      target: { value: "ERROR" },
    });
    fireEvent.click(screen.getByLabelText("쿠폰 적용"));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("쿠폰 적용 중 오류가 발생했습니다");
    });
  });

  // ─── 적용된 쿠폰 표시 ───────────────────────────────────────────────────

  it("적용된 쿠폰이 있으면 쿠폰 코드와 제거 버튼을 표시한다", () => {
    const onRemove = vi.fn();
    renderCouponInput({ appliedCoupon: "SAVE5000", onRemove });

    expect(screen.getByText("SAVE5000")).toBeTruthy();
    expect(screen.getByLabelText("쿠폰 제거")).toBeTruthy();
  });

  it("제거 버튼 클릭 시 onRemove를 호출한다", () => {
    const onRemove = vi.fn();
    renderCouponInput({ appliedCoupon: "SAVE5000", onRemove });

    fireEvent.click(screen.getByLabelText("쿠폰 제거"));
    expect(onRemove).toHaveBeenCalled();
  });
});
