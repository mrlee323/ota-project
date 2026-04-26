"use client";

import { useState } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

interface CityInputStepProps {
  onSubmit: (cityName: string) => void;
}

/** 도시 입력 스텝 - 텍스트 입력으로 도시명 입력 */
export function CityInputStep({ onSubmit }: CityInputStepProps) {
  const [cityName, setCityName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = cityName.trim();
    if (!trimmed) {
      setError("도시명을 입력해 주세요");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">도시를 입력하세요</h2>
        <p className="mt-1 text-sm text-gray-500">쇼케이스를 생성할 도시명을 입력합니다.</p>
      </div>
      <div className="mx-auto max-w-sm space-y-4">
        <Input
          label="도시명"
          placeholder="예: 서울, 도쿄, 방콕"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          error={error}
        />
        <Button variant="primary" className="w-full" onClick={handleSubmit}>
          다음
        </Button>
      </div>
    </div>
  );
}
