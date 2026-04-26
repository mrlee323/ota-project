"use client";

import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// ─── Props ──────────────────────────────────────────────────────────────────

interface DatePickerProps {
  /** 선택된 날짜 (YYYY-MM-DD 또는 빈 문자열) */
  value: string;
  /** 날짜 변경 콜백 (YYYY-MM-DD) */
  onChange: (date: string) => void;
  /** 라벨 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 플레이스홀더 */
  placeholder?: string;
}

// ─── 컴포넌트 ───────────────────────────────────────────────────────────────

/** 단일 날짜 선택기 — react-day-picker 기반 */
export function DatePicker({ value, onChange, label, error, placeholder = "날짜를 선택하세요" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value) return undefined;
    return new Date(value + "T00:00:00");
  }, [value]);

  const handleDayClick = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full space-y-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-3 rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors hover:border-gray-400 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? format(new Date(value + "T00:00:00"), "yyyy년 M월 d일 (EEE)", { locale: ko }) : placeholder}
        </span>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={() => {}}
            onDayClick={handleDayClick}
            locale={ko}
            showOutsideDays={false}
            classNames={{
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
              today: "font-bold text-brand",
              disabled: "text-gray-300 cursor-not-allowed",
              outside: "invisible",
            }}
          />
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
