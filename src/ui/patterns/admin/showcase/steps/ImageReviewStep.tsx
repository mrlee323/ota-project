"use client";

import { useState } from "react";
import { Button } from "@/ui/components/Button";

interface ImageReviewStepProps {
  imageUrl: string;
  title: string;
  onConfirm: () => void;
  onRegenerate: () => void;
  onBack?: () => void;
}

/** 이미지 확인 스텝 - 생성된 이미지를 검토, 재생성 가능 */
export function ImageReviewStep({ imageUrl, title, onConfirm, onRegenerate, onBack }: ImageReviewStepProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="w-full overflow-hidden rounded-lg border border-gray-200">
        {hasError ? (
          <div className="flex h-48 items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-400">이미지를 불러올 수 없습니다.</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`${title} 쇼케이스 이미지`}
            className="h-auto w-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <div className="flex gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            이전
          </Button>
        )}
        <Button variant="outline" onClick={onRegenerate}>
          이미지 재생성
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </div>
  );
}
