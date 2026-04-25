"use client";

import React, { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { ko } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

interface SearchDatePickerProps {
  /** 체크인 날짜 (YYYY-MM-DD) */
  checkInDate: string;
  /** 체크아웃 날짜 (YYYY-MM-DD) */
  checkOutDate: string;
  /** 날짜 변경 콜백 */
  onChange: (checkInDate: string, checkOutDate: string) => void;
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

/** 날짜를 한국어 짧은 형식으로 표시 (예: 1월 22일) */
function formatShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return format(d, "M월 d일", { locale: ko });
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

/** 체크인/체크아웃 날짜 범위 선택기 — react-day-picker 기반 캘린더 */
export function SearchDatePicker({
  checkInDate,
  checkOutDate,
  onChange,
}: SearchDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 체크인만 선택된 중간 상태를 추적한다
  const [pendingCheckIn, setPendingCheckIn] = useState<Date | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 캘린더에 표시할 선택 범위
  const selected: DateRange = useMemo(() => {
    if (pendingCheckIn) {
      // 체크인만 선택된 중간 상태 — from만 설정
      return { from: pendingCheckIn, to: undefined };
    }
    return { from: parseDate(checkInDate), to: parseDate(checkOutDate) };
  }, [checkInDate, checkOutDate, pendingCheckIn]);

  // 숙박 일수
  const nights = differenceInCalendarDays(
    parseDate(checkOutDate),
    parseDate(checkInDate),
  );

  const MAX_NIGHTS = 28;

  // 비활성화 조건: 오늘 이전 + 체크인 선택 시 28박 이후
  const disabledMatcher = useMemo(() => {
    const matchers: Array<{ before: Date } | { after: Date }> = [{ before: today }];
    if (pendingCheckIn) {
      matchers.push({ after: addDays(pendingCheckIn, MAX_NIGHTS) });
    }
    return matchers;
  }, [today, pendingCheckIn]);

  // 날짜 클릭 핸들러 — react-day-picker의 range 로직을 우회하여 직접 제어
  const handleDayClick = (day: Date) => {
    // 오늘 이전 날짜는 무시
    if (day < today) return;

    if (pendingCheckIn) {
      // 28박 초과 날짜는 무시
      if (differenceInCalendarDays(day, pendingCheckIn) > MAX_NIGHTS) return;

      // 이미 체크인이 선택된 상태 → 두 번째 클릭
      if (day > pendingCheckIn) {
        // 체크인 이후 날짜 → 체크아웃 확정, 캘린더 닫기
        onChange(formatDateStr(pendingCheckIn), formatDateStr(day));
        setPendingCheckIn(null);
        setIsOpen(false);
      } else {
        // 체크인 이전 또는 같은 날짜 → 새 체크인으로 재설정
        setPendingCheckIn(day);
      }
    } else {
      // 첫 번째 클릭 → 새 체크인 설정, 캘린더 유지
      setPendingCheckIn(day);
    }
  };

  // onSelect는 selected 상태 동기화용 (실제 로직은 onDayClick에서 처리)
  const handleSelect = () => {
    // noop — onDayClick에서 모든 로직을 처리한다
  };

  // 외부 클릭 시 체크인만 선택된 상태면 +1일 체크아웃 자동 설정 후 닫기
  const handleOutsideClick = () => {
    if (pendingCheckIn) {
      const checkIn = formatDateStr(pendingCheckIn);
      const checkOut = formatDateStr(addDays(pendingCheckIn, 1));
      onChange(checkIn, checkOut);
      setPendingCheckIn(null);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => {
          setPendingCheckIn(null);
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
      >
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="flex-1">
          <p className="text-xs text-gray-500">숙박 기간</p>
          <p className="text-sm font-medium text-gray-900">
            {formatShort(checkInDate)} → {formatShort(checkOutDate)}
            <span className="ml-1 text-gray-500">({nights}박)</span>
          </p>
        </div>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 캘린더 드롭다운 */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            onDayClick={handleDayClick}
            locale={ko}
            numberOfMonths={2}
            disabled={disabledMatcher}
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
            {pendingCheckIn
              ? "체크아웃 날짜를 선택하세요"
              : "체크인 날짜를 선택한 후 체크아웃 날짜를 선택하세요"}
          </p>
        </div>
      )}

      {/* 배경 오버레이 — 외부 클릭 시 체크인만 선택된 상태면 +1일 체크아웃 자동 설정 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleOutsideClick}
        />
      )}
    </div>
  );
}
