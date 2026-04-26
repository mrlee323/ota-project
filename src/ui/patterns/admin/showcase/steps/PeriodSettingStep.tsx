"use client";

import { useState } from "react";
import { Button } from "@/ui/components/Button";
import { DateRangePicker } from "@/ui/components/DateRangePicker";

interface PeriodSettingStepProps {
  onSubmit: (startDate: string, endDate: string) => void;
  onBack?: () => void;
}

/** 노출 기간 설정 스텝 - 캘린더로 시작일/종료일 선택 */
export function PeriodSettingStep({ onSubmit, onBack }: PeriodSettingStepProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setError("");
  };

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      setError("시작일과 종료일을 모두 선택해 주세요");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError("시작일은 종료일보다 이전이어야 합니다");
      return;
    }
    setError("");
    onSubmit(start.toISOString(), end.toISOString());
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">노출 기간을 설정하세요</h2>
        <p className="mt-1 text-sm text-gray-500">쇼케이스가 서비스에 노출될 기간을 설정합니다.</p>
      </div>
      <div className="mx-auto max-w-sm space-y-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
          error={error}
        />
        <div className="flex gap-3">
          {onBack && (
            <Button variant="outline" className="flex-1" onClick={onBack}>
              이전
            </Button>
          )}
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!startDate || !endDate}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
