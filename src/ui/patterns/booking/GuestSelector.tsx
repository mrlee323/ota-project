"use client";

import React, { useState } from "react";
import { canAddGuest, canRemoveAdult } from "@/domain/search/validation";

// ─── Props 인터페이스 ────────────────────────────────────────────────────────

interface GuestSelectorProps {
  /** 성인 수 */
  adultCount: number;
  /** 아동 나이 배열 */
  childrenAges: number[];
  /** 인원 변경 콜백 */
  onChange: (adultCount: number, childrenAges: number[]) => void;
}

// ─── 인라인 카운터 ───────────────────────────────────────────────────────────

/** 컴팩트 카운터 (라벨 + −/+ 버튼) */
function CompactCounter({
  label,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement: boolean;
  disableIncrement: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          aria-label={`${label} 감소`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disableIncrement}
          aria-label={`${label} 증가`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

/** 컴팩트 인원 선택기 — 드롭다운 방식, 아동 나이는 인라인 셀렉트 */
export function GuestSelector({ adultCount, childrenAges, onChange }: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const childrenCount = childrenAges.length;
  const canAdd = canAddGuest(adultCount, childrenCount);
  const canDecreaseAdult = canRemoveAdult(adultCount);

  // 인원 요약 텍스트
  const summaryText = childrenCount > 0
    ? `성인 ${adultCount}명, 아동 ${childrenCount}명`
    : `성인 ${adultCount}명`;

  return (
    <div className="relative">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
      >
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-xs text-gray-500">인원</p>
          <p className="text-sm font-medium text-gray-900">{summaryText}</p>
        </div>
        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          {/* 성인 */}
          <CompactCounter
            label="성인"
            value={adultCount}
            onDecrement={() => canDecreaseAdult && onChange(adultCount - 1, childrenAges)}
            onIncrement={() => canAdd && onChange(adultCount + 1, childrenAges)}
            disableDecrement={!canDecreaseAdult}
            disableIncrement={!canAdd}
          />

          <div className="my-2 border-t border-gray-100" />

          {/* 아동 */}
          <CompactCounter
            label="아동"
            value={childrenCount}
            onDecrement={() => {
              if (childrenCount > 0) {
                onChange(adultCount, childrenAges.slice(0, -1));
              }
            }}
            onIncrement={() => canAdd && onChange(adultCount, [...childrenAges, 0])}
            disableDecrement={childrenCount === 0}
            disableIncrement={!canAdd}
          />

          {/* 아동 나이 — 가로 인라인 배치 */}
          {childrenCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {childrenAges.map((age, i) => (
                <select
                  key={i}
                  value={age}
                  onChange={(e) => {
                    const next = [...childrenAges];
                    next[i] = Number(e.target.value);
                    onChange(adultCount, next);
                  }}
                  aria-label={`아동 ${i + 1} 나이 선택`}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {Array.from({ length: 18 }, (_, a) => (
                    <option key={a} value={a}>아동{i + 1}: {a}세</option>
                  ))}
                </select>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-gray-400">최대 8명 (성인 + 아동)</p>
        </div>
      )}

      {/* 배경 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
