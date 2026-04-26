"use client";

import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ShowcaseContent } from "@/domain/admin/showcaseContent";
import { showcaseService } from "@/infrastructure/admin/showcaseServiceClient";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { Input } from "@/ui/components/Input";

// ─── 폼 스키마 ───────────────────────────────────────────────────────────────

const editFormSchema = z
  .object({
    title: z.string().min(1, "타이틀을 입력해 주세요"),
    imageUrl: z.string().url("유효한 URL을 입력해 주세요"),
    serviceEnabled: z.boolean(),
    startDate: z.string().min(1, "시작일을 선택해 주세요"),
    startTime: z.string().min(1, "시작 시간을 입력해 주세요"),
    endDate: z.string().min(1, "종료일을 선택해 주세요"),
    endTime: z.string().min(1, "종료 시간을 입력해 주세요"),
  })
  .refine(
    (d) =>
      new Date(`${d.startDate}T${d.startTime}:00`) <
      new Date(`${d.endDate}T${d.endTime}:00`),
    { message: "시작일시는 종료일시보다 이전이어야 합니다", path: ["startDate"] },
  );

type EditFormValues = z.infer<typeof editFormSchema>;

// ─── 폼 컴포넌트 (데이터가 있을 때만 마운트) ───────────────────────────────

interface ShowcaseEditFormProps {
  id: string;
  showcase: ShowcaseContent;
}

function ShowcaseEditForm({ id, showcase }: ShowcaseEditFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: showcase.title,
      imageUrl: showcase.imageUrl,
      serviceEnabled: showcase.serviceEnabled,
      startDate: format(new Date(showcase.startDate), "yyyy-MM-dd"),
      startTime: format(new Date(showcase.startDate), "HH:mm"),
      endDate: format(new Date(showcase.endDate), "yyyy-MM-dd"),
      endTime: format(new Date(showcase.endDate), "HH:mm"),
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ShowcaseContent>) =>
      showcaseService.updateShowcase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
    },
  });

  const onSubmit = (values: EditFormValues) => {
    updateMutation.mutate({
      title: values.title,
      imageUrl: values.imageUrl,
      serviceEnabled: values.serviceEnabled,
      startDate: new Date(`${values.startDate}T${values.startTime}:00`).toISOString(),
      endDate: new Date(`${values.endDate}T${values.endTime}:00`).toISOString(),
    });
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="타이틀"
            placeholder="쇼케이스 타이틀을 입력하세요"
            error={errors.title?.message}
            {...register("title")}
          />

          <Input
            label="이미지 URL"
            placeholder="https://example.com/image.jpg"
            error={errors.imageUrl?.message}
            {...register("imageUrl")}
          />

          {/* 서비스 활성화 토글 */}
          <div className="w-full space-y-1.5">
            <label className="text-sm font-medium text-gray-700">서비스 활성화</label>
            <Controller
              control={control}
              name="serviceEnabled"
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    field.value ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      field.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            />
          </div>

          {/* 노출 기간 (날짜 + 시간) */}
          <div className="space-y-3">
            <Controller
              control={control}
              name="startDate"
              render={({ field: startField }) => (
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: endField }) => (
                    <DateRangePicker
                      startDate={startField.value}
                      endDate={endField.value}
                      onChange={(start, end) => {
                        startField.onChange(start);
                        endField.onChange(end);
                      }}
                      error={errors.startDate?.message}
                    />
                  )}
                />
              )}
            />
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">시작 시간</label>
                <input
                  type="time"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  {...register("startTime")}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">종료 시간</label>
                <input
                  type="time"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  {...register("endTime")}
                />
              </div>
            </div>
          </div>

          {isSubmitSuccessful && updateMutation.isSuccess && (
            <p className="text-sm text-green-600">저장이 완료되었습니다.</p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-red-500">저장에 실패했습니다. 다시 시도해 주세요.</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── 외부 컴포넌트 (데이터 페칭 + 상태 분기) ──────────────────────────────

interface ShowcaseEditViewProps {
  id: string;
}

export function ShowcaseEditView({ id }: ShowcaseEditViewProps) {
  const { data: showcase, isLoading, isError } = useQuery<ShowcaseContent | null>({
    queryKey: ["showcase", id],
    queryFn: () => showcaseService.getShowcaseById(id),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">쇼케이스 편집</h1>
        <Link href="/admin/content/showcase">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>

      {isLoading && (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">컨텐츠를 불러오는 중...</p>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent>
            <p className="text-center text-red-500 py-8">데이터를 불러오는 데 실패했습니다.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && !showcase && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-700 mb-4">컨텐츠를 찾을 수 없습니다</p>
            <Link href="/admin/content/showcase">
              <Button variant="outline">목록으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {showcase && <ShowcaseEditForm id={id} showcase={showcase} />}
    </div>
  );
}
