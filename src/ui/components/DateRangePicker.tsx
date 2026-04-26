"use client";

import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

interface DateRangePickerProps {
  /** 시작일 (YYYY-MM-DD 또는 빈 문자열) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD 또는 빈 문자열) */
  endDate: string;
  /** 날짜 변경 콜백 */
  onChange: (startDate: string, endDate: string) => void;
  /** 에러 메시지 */
  error?: string;
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD 문자열을 Date 객체로 변환 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/** Date 객체를 YYYY-MM-DD 문자열로 변환 */
function formatDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** 날짜를 한국어 짧은 형식으로 표시 */
function formatShort(dateStr: string): string {
  return format(parseDate(dateStr), "yyyy년 M월 d일", { locale: ko });
}

// ─── 컴포넌트 ───────────────────────────────────────────────────────────────

/** 노출 기간 선택용 날짜 범위 선택기 */
export function DateRangePicker({ startDate, endDate, onChange, error }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const selected: DateRange = useMemo(() => {
    if (pendingStart) {
      return { from: pendingStart, to: undefined };
    }
    if (startDate && endDate) {
      return { from: parseDate(startDate), to: parseDate(endDate) };
    }
    return { from: undefined, to: undefined };
  }, [startDate, endDate, pendingStart]);

  /** 날짜 클릭 핸들러 */
  const handleDayClick = (day: Date) => {
    if (pendingStart) {
      if (day > pendingStart) {
        onChange(formatDateStr(pendingStart), formatDateStr(day));
        setPendingStart(null);
        setIsOpen(false);
      } else {
        setPendingStart(day);
      }
    } else {
      setPendingStart(day);
    }
  };

  // onSelect는 selected 상태 동기화용 (실제 로직은 onDayClick에서 처리)
  const handleSelect = () => {};

  const handleOutsideClick = () => {
    setPendingStart(null);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full space-y-1.5">
      <label className="text-sm font-medium text-gray-700">노출 기간</label>
      <button
        type="button"
        onClick={() => {
          setPendingStart(null);
          setIsOpen(!isOpen);
        }}
        className={`flex w-full items-center gap-3 rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors hover:border-gray-400 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={startDate && endDate ? "text-gray-900" : "text-gray-400"}>
          {startDate && endDate
            ? `${formatShort(startDate)} ~ ${formatShort(endDate)}`
            : "시작일과 종료일을 선택하세요"}
        </span>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            onDayClick={handleDayClick}
            locale={ko}
            numberOfMonths={2}
            showOutsideDays={false}
            classNames={{
              months: "flex gap-4",
              month_caption: "flex justify-center py-1 text-sm font-semibold text-gray-900",
              nav: "flex items-center",
              button_previous: "absolute left-1 top-2 p-1 text-gray-500 hover:text-gray-900",
              button_next: "absolute right-1 top-2 p-1 text-gray-500 hover:text-gray-900",
              weekdays: "flex",
              weekday: "w-9 text-center text-xs font-medium text-gray-500",
              week: "flex",
              day: "h-9 w-9 text-center text-sm",
              day_button: "flex h-full w-full items-center justify-center rounded-full text-sm text-gray-900 transition-colors hover:bg-blue-100 hover:text-blue-900",
              selected: "bg-brand !text-white rounded-full",
              range_start: "bg-brand text-white rounded-l-full [&>button]:text-white",
              range_end: "bg-brand text-white rounded-r-full [&>button]:text-white",
              range_middle: "bg-purple-100 [&>button]:text-gray-900",
              today: "font-bold text-brand",
              disabled: "text-gray-300 cursor-not-allowed hover:bg-transparent hover:text-gray-300 [&>button]:text-gray-300 [&>button]:cursor-not-allowed",
              outside: "invisible",
            }}
          />
          <p className="mt-2 text-center text-xs text-gray-500">
            {pendingStart ? "종료일을 선택하세요" : "시작일을 선택한 후 종료일을 선택하세요"}
          </p>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={handleOutsideClick} />
      )}
    </div>
  );
}
