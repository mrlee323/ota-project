"use client";

import { useState } from "react";
import { useImageUpload } from "@/application/useImageUpload";
import { Button } from "@/ui/components/Button";

interface ImageReviewStepProps {
  imageUrl: string;
  title: string;
  onConfirm: () => void;
  onRegenerate: () => void;
  onUploadImage: (url: string) => void;
  onBack?: () => void;
}

/** 이미지 확인 스텝 - 생성된 이미지를 검토, 재생성 또는 직접 업로드 가능 */
export function ImageReviewStep({ imageUrl, title, onConfirm, onRegenerate, onUploadImage, onBack }: ImageReviewStepProps) {
  const [hasError, setHasError] = useState(false);
  const { uploadFile, isUploading } = useImageUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, { folder: "showcase" });
      onUploadImage(url);
      setHasError(false);
    } catch {
      // 업로드 실패 시 무시 (useImageUpload 내부에서 에러 상태 관리)
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
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
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-sm font-medium text-white">업로드 중...</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            이전
          </Button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          직접 업로드
          <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} disabled={isUploading} />
        </label>
        <Button variant="outline" onClick={onRegenerate} disabled={isUploading}>
          AI 재생성
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isUploading}>
          확인
        </Button>
      </div>
    </div>
  );
}
