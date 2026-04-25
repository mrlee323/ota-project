import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchDatePicker } from "./SearchDatePicker";

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

const FIXED_TODAY = "2025-01-15";
const FUTURE_CHECK_IN = "2025-01-22";
const FUTURE_CHECK_OUT = "2025-01-23";

function renderDatePicker(
  overrides: Partial<{
    checkInDate: string;
    checkOutDate: string;
    onChange: (checkInDate: string, checkOutDate: string) => void;
  }> = {},
) {
  const onChange = overrides.onChange ?? vi.fn();
  const props = {
    checkInDate: overrides.checkInDate ?? FUTURE_CHECK_IN,
    checkOutDate: overrides.checkOutDate ?? FUTURE_CHECK_OUT,
    onChange,
  };
  const result = render(<SearchDatePicker {...props} />);
  return { ...result, onChange };
}

// ─── 테스트 ──────────────────────────────────────────────────────────────────

describe("SearchDatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${FIXED_TODAY}T00:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("트리거 버튼에 체크인/체크아웃 날짜와 숙박 일수를 표시한다", () => {
    renderDatePicker({
      checkInDate: FUTURE_CHECK_IN,
      checkOutDate: FUTURE_CHECK_OUT,
    });
    // "1월 22일 → 1월 23일 (1박)" 형태로 표시
    expect(screen.getByText(/1월 22일/)).toBeTruthy();
    expect(screen.getByText(/1월 23일/)).toBeTruthy();
    expect(screen.getByText(/1박/)).toBeTruthy();
  });

  it("2박 이상일 때 숙박 일수를 올바르게 표시한다", () => {
    renderDatePicker({
      checkInDate: "2025-01-22",
      checkOutDate: "2025-01-25",
    });
    expect(screen.getByText(/3박/)).toBeTruthy();
  });

  it("트리거 버튼 클릭 시 캘린더가 열린다", () => {
    renderDatePicker();
    const trigger = screen.getByText(/숙박 기간/).closest("button")!;
    fireEvent.click(trigger);
    // 캘린더 안내 텍스트가 표시되는지 확인
    expect(screen.getByText(/체크인 날짜를 선택한 후/)).toBeTruthy();
  });

  it("캘린더가 닫힌 상태에서는 안내 텍스트가 보이지 않는다", () => {
    renderDatePicker();
    expect(screen.queryByText(/체크인 날짜를 선택한 후/)).toBeNull();
  });
});
