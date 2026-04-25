import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuestSelector } from "./GuestSelector";

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function renderSelector(
  overrides: Partial<{
    adultCount: number;
    childrenAges: number[];
    onChange: (adultCount: number, childrenAges: number[]) => void;
  }> = {},
) {
  const onChange = overrides.onChange ?? vi.fn();
  const props = {
    adultCount: overrides.adultCount ?? 2,
    childrenAges: overrides.childrenAges ?? [],
    onChange,
  };
  const result = render(<GuestSelector {...props} />);
  return { ...result, onChange };
}

/** 드롭다운을 열어 카운터 UI를 표시한다 */
function openDropdown() {
  // 트리거 버튼 클릭 (인원 텍스트가 포함된 버튼)
  const trigger = screen.getByText(/성인/);
  fireEvent.click(trigger.closest("button")!);
}

// ─── 테스트 ──────────────────────────────────────────────────────────────────

describe("GuestSelector", () => {
  it("트리거 버튼에 인원 요약을 표시한다", () => {
    renderSelector({ adultCount: 2, childrenAges: [5] });
    expect(screen.getByText("성인 2명, 아동 1명")).toBeTruthy();
  });

  it("아동 없을 때 성인만 표시한다", () => {
    renderSelector({ adultCount: 3, childrenAges: [] });
    expect(screen.getByText("성인 3명")).toBeTruthy();
  });

  // ─── 성인 증감 ───────────────────────────────────────────────────────────

  it("성인 증가 버튼 클릭 시 adultCount + 1로 onChange를 호출한다", () => {
    const { onChange } = renderSelector({ adultCount: 2, childrenAges: [] });
    openDropdown();
    fireEvent.click(screen.getByLabelText("성인 증가"));
    expect(onChange).toHaveBeenCalledWith(3, []);
  });

  it("성인 감소 버튼 클릭 시 adultCount - 1로 onChange를 호출한다", () => {
    const { onChange } = renderSelector({ adultCount: 3, childrenAges: [] });
    openDropdown();
    fireEvent.click(screen.getByLabelText("성인 감소"));
    expect(onChange).toHaveBeenCalledWith(2, []);
  });

  it("성인 1명일 때 감소 버튼이 비활성화된다", () => {
    renderSelector({ adultCount: 1, childrenAges: [] });
    openDropdown();
    const btn = screen.getByLabelText("성인 감소") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ─── 아동 증감 ───────────────────────────────────────────────────────────

  it("아동 증가 버튼 클릭 시 나이 0세 아동이 추가된다", () => {
    const { onChange } = renderSelector({ adultCount: 2, childrenAges: [] });
    openDropdown();
    fireEvent.click(screen.getByLabelText("아동 증가"));
    expect(onChange).toHaveBeenCalledWith(2, [0]);
  });

  it("아동이 있을 때 나이 선택 드롭다운이 표시된다", () => {
    renderSelector({ adultCount: 2, childrenAges: [5, 10] });
    openDropdown();
    expect(screen.getByLabelText("아동 1 나이 선택")).toBeTruthy();
    expect(screen.getByLabelText("아동 2 나이 선택")).toBeTruthy();
  });

  it("아동 나이를 변경하면 해당 인덱스의 나이가 업데이트된다", () => {
    const { onChange } = renderSelector({ adultCount: 2, childrenAges: [5, 10] });
    openDropdown();
    fireEvent.change(screen.getByLabelText("아동 1 나이 선택"), {
      target: { value: "3" },
    });
    expect(onChange).toHaveBeenCalledWith(2, [3, 10]);
  });

  it("아동 감소 버튼 클릭 시 마지막 아동이 제거된다", () => {
    const { onChange } = renderSelector({ adultCount: 2, childrenAges: [5, 10] });
    openDropdown();
    fireEvent.click(screen.getByLabelText("아동 감소"));
    expect(onChange).toHaveBeenCalledWith(2, [5]);
  });

  it("아동 0명일 때 아동 감소 버튼이 비활성화된다", () => {
    renderSelector({ adultCount: 2, childrenAges: [] });
    openDropdown();
    const btn = screen.getByLabelText("아동 감소") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // ─── 최대 인원 제한 ─────────────────────────────────────────────────────

  it("총 인원 8명 도달 시 성인 증가 버튼이 비활성화된다", () => {
    renderSelector({ adultCount: 6, childrenAges: [5, 10] }); // 6 + 2 = 8
    openDropdown();
    const btn = screen.getByLabelText("성인 증가") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("총 인원 8명 도달 시 아동 증가 버튼이 비활성화된다", () => {
    renderSelector({ adultCount: 6, childrenAges: [5, 10] }); // 6 + 2 = 8
    openDropdown();
    const btn = screen.getByLabelText("아동 증가") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("총 인원 8명 미만이면 추가 버튼이 활성화된다", () => {
    renderSelector({ adultCount: 3, childrenAges: [5] }); // 3 + 1 = 4
    openDropdown();
    const adultBtn = screen.getByLabelText("성인 증가") as HTMLButtonElement;
    const childBtn = screen.getByLabelText("아동 증가") as HTMLButtonElement;
    expect(adultBtn.disabled).toBe(false);
    expect(childBtn.disabled).toBe(false);
  });
});
