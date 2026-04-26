"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { ShowcaseContent } from "@/domain/admin/showcaseContent";
import { showcaseService } from "@/infrastructure/admin/showcaseServiceClient";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { Input } from "@/ui/components/Input";

// ─── 검증 스키마 ────────────────────────────────────────────────────────────

/** 편집 폼 입력값 검증 스키마 */
const editFormSchema = z.object({
  title: z.string().min(1, "타이틀을 입력해 주세요"),
  imageUrl: z.string().url("유효한 URL을 입력해 주세요"),
  startDate: z.string().min(1, "시작일을 입력해 주세요"),
  endDate: z.string().min(1, "종료일을 입력해 주세요"),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: "시작일은 종료일보다 이전이어야 합니다", path: ["startDate"] },
);

// ─── Props 인터페이스 ───────────────────────────────────────────────────────

interface ShowcaseEditViewProps {
  id: string;
}

// ─── 필드별 에러 타입 ───────────────────────────────────────────────────────

interface FormErrors {
  title?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

// ─── ShowcaseEditView 컴포넌트 ──────────────────────────────────────────────

/** 쇼케이스 컨텐츠 편집 뷰 */
export function ShowcaseEditView({ id }: ShowcaseEditViewProps) {
  const queryClient = useQueryClient();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 데이터 조회
  const {
    data: showcase,
    isLoading,
    isError,
  } = useQuery<ShowcaseContent | null>({
    queryKey: ["showcase", id],
    queryFn: () => showcaseService.getShowcaseById(id),
  });

  // 조회된 데이터로 폼 초기화
  useEffect(() => {
    if (showcase) {
      setTitle(showcase.title);
      setImageUrl(showcase.imageUrl);
      setServiceEnabled(showcase.serviceEnabled);
      // ISO datetime을 date input 형식(YYYY-MM-DD)으로 변환
      setStartDate(showcase.startDate.split("T")[0]);
      setEndDate(showcase.endDate.split("T")[0]);
    }
  }, [showcase]);

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ShowcaseContent>) =>
      showcaseService.updateShowcase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
      setSaveSuccess(true);
    },
  });

  /** 폼 제출 핸들러 */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaveSuccess(false);

    // Zod 검증
    const result = editFormSchema.safeParse({ title, imageUrl, startDate, endDate });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    // 날짜를 ISO 형식으로 변환하여 저장
    updateMutation.mutate({
      title,
      imageUrl,
      serviceEnabled,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            컨텐츠를 불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Card>
        <CardContent>
          <p className="text-center text-red-500 py-8">
            데이터를 불러오는 데 실패했습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 존재하지 않는 id
  if (!showcase) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-700 mb-4">컨텐츠를 찾을 수 없습니다</p>
          <Link href="/admin/content/showcase">
            <Button variant="outline">목록으로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">쇼케이스 편집</h1>
        <Link href="/admin/content/showcase">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>

      {/* 편집 폼 */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 타이틀 필드 */}
            <Input
              label="타이틀"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="쇼케이스 타이틀을 입력하세요"
              error={errors.title}
            />

            {/* 이미지 URL 필드 */}
            <Input
              label="이미지 URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              error={errors.imageUrl}
            />

            {/* 서비스 활성화 토글 */}
            <div className="w-full space-y-1.5">
              <label className="text-sm font-medium text-gray-700">서비스 활성화</label>
              <button
                type="button"
                role="switch"
                aria-checked={serviceEnabled}
                onClick={() => setServiceEnabled(!serviceEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  serviceEnabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  serviceEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* 노출 기간 (캘린더 선택) */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              error={errors.startDate}
            />

            {/* 저장 성공 메시지 */}
            {saveSuccess && (
              <p className="text-sm text-green-600">
                저장이 완료되었습니다.
              </p>
            )}

            {/* 뮤테이션 에러 메시지 */}
            {updateMutation.isError && (
              <p className="text-sm text-red-500">
                저장에 실패했습니다. 다시 시도해 주세요.
              </p>
            )}

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
