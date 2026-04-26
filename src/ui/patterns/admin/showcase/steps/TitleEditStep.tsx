"use client";

import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

interface TitleEditStepProps {
  title: string;
  cityName: string;
  onConfirm: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onBack?: () => void;
}

/** 타이틀 편집 스텝 - 생성된 타이틀을 확인하고 수정 가능 */
export function TitleEditStep({ title, cityName, onConfirm, onUpdateTitle, onBack }: TitleEditStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{cityName}</span> 쇼케이스
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">타이틀을 확인하세요</h2>
      </div>
      <div className="mx-auto max-w-md space-y-4">
        <Input
          label="타이틀"
          value={title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="쇼케이스 타이틀"
        />
        <div className="flex gap-3">
          {onBack && (
            <Button variant="outline" className="flex-1" onClick={onBack}>
              이전
            </Button>
          )}
          <Button variant="primary" className="flex-1" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
