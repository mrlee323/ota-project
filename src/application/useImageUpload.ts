"use client";

import { useState } from "react";

interface UploadFileOptions {
  folder?: string;
}

interface GenerateImageParams {
  cityName: string;
  title?: string;
  prompt?: string;
  folder?: string;
}

interface UseImageUploadReturn {
  /** 사용자가 선택한 파일을 업로드하고 URL을 반환한다 */
  uploadFile: (file: File, options?: UploadFileOptions) => Promise<string>;
  /** LLM으로 이미지를 생성하고 Storage에 업로드한 뒤 URL을 반환한다 */
  generateImage: (params: GenerateImageParams) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

async function apiFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/**
 * 이미지 업로드 공통 훅
 * - uploadFile: 파일 직접 업로드 (file input)
 * - generateImage: Hugging Face FLUX로 AI 이미지 생성 후 업로드
 *
 * 서비스/어드민 모두에서 사용 가능.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    options?: UploadFileOptions,
  ): Promise<string> => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options?.folder) formData.append("folder", options.folder);

      const { url } = await apiFetch<{ url: string }>("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "업로드 실패";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const generateImage = async (params: GenerateImageParams): Promise<string> => {
    setIsUploading(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>(
        "/api/upload/image/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "이미지 생성 실패";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    generateImage,
    isUploading,
    error,
    reset: () => setError(null),
  };
}
