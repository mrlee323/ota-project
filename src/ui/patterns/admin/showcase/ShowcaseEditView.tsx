"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ShowcaseContent } from "@/domain/admin/showcaseContent";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import { showcaseHotelCardSchema } from "@/domain/hotel/showcaseTypes";
import { showcaseService } from "@/infrastructure/admin/showcaseServiceClient";
import {
  generateShowcaseHotels,
  generateShowcaseTitle,
} from "@/infrastructure/admin/showcaseGeneration";
import { useImageUpload } from "@/application/useImageUpload";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { DatePicker } from "@/ui/components/DatePicker";
import { Input } from "@/ui/components/Input";
import { useToast } from "@/ui/components/Toast";

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
    hotels: z.array(showcaseHotelCardSchema),
  })
  .refine(
    (d) =>
      new Date(`${d.startDate}T${d.startTime}:00`) <
      new Date(`${d.endDate}T${d.endTime}:00`),
    { message: "시작일시는 종료일시보다 이전이어야 합니다", path: ["startDate"] },
  );

type EditFormValues = z.infer<typeof editFormSchema>;

function normalizeHotelCard(hotel: EditFormValues["hotels"][number]): ShowcaseHotelCard {
  const { id, name, location, imageUrl, stars, discountRate, originalPrice, discountPrice, isAppDiscount, taxIncluded, badges } = hotel;
  return {
    id,
    name,
    location,
    imageUrl,
    stars,
    discountRate,
    originalPrice,
    discountPrice,
    isAppDiscount,
    taxIncluded,
    badges: [...badges],
  };
}

// ─── 폼 컴포넌트 (데이터가 있을 때만 마운트) ───────────────────────────────

interface ShowcaseEditFormProps {
  id: string;
  showcase: ShowcaseContent;
}

function ShowcaseEditForm({ id, showcase }: ShowcaseEditFormProps) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { uploadFile, generateImage: generateImageUpload, isUploading: isImageUploading } = useImageUpload();

  // 호텔 추가 모드 상태
  const [isAddingHotels, setIsAddingHotels] = useState(false);
  const [candidateHotels, setCandidateHotels] = useState<ShowcaseHotelCard[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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
      hotels: showcase.hotels,
    },
  });

  const { fields: hotelFields, remove: removeHotel, append: appendHotel } = useFieldArray({
    control,
    name: "hotels",
    keyName: "fieldKey",
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ShowcaseContent>) =>
      showcaseService.updateShowcase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
      pushToast({
        title: "저장 완료",
        description: "쇼케이스가 저장되었습니다.",
        variant: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: "저장 실패",
        description:
          error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
        variant: "error",
      });
    },
  });

  const generateTitleMutation = useMutation({
    mutationFn: () => generateShowcaseTitle(showcaseService, showcase.cityName),
    onSuccess: (title) => {
      setValue("title", title, { shouldValidate: true });
      pushToast({
        title: "AI 타이틀 재생성 완료",
        description: "타이틀을 새로 만들었습니다.",
        variant: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: "타이틀 생성 실패",
        description:
          error instanceof Error ? error.message : "타이틀 생성 중 오류가 발생했습니다.",
        variant: "error",
      });
    },
  });

  const handleGenerateImage = async () => {
    try {
      const url = await generateImageUpload({
        cityName: showcase.cityName,
        title: watch("title") || showcase.title,
        folder: "showcase",
      });
      setValue("imageUrl", url, { shouldValidate: true });
      pushToast({ title: "AI 이미지 재생성 완료", description: "대표 이미지를 새로 만들었습니다.", variant: "success" });
    } catch {
      pushToast({ title: "이미지 생성 실패", description: "이미지 생성 중 오류가 발생했습니다.", variant: "error" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, { folder: "showcase" });
      setValue("imageUrl", url, { shouldValidate: true });
      pushToast({ title: "이미지 업로드 완료", description: "이미지가 업로드됐습니다.", variant: "success" });
    } catch {
      pushToast({ title: "업로드 실패", description: "이미지 업로드 중 오류가 발생했습니다.", variant: "error" });
    }
    e.target.value = "";
  };

  const generateHotelsMutation = useMutation({
    mutationFn: () => generateShowcaseHotels(showcaseService, showcase.cityName, watch("title") || showcase.title),
    onSuccess: (hotels) => {
      setCandidateHotels(hotels);
      setSelectedCandidateIds(hotels.map((h) => h.id));
      setIsAddingHotels(true);
      pushToast({
        title: "AI 호텔 생성 완료",
        description: "추가할 호텔 후보를 불러왔습니다.",
        variant: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: "호텔 생성 실패",
        description:
          error instanceof Error ? error.message : "호텔 생성 중 오류가 발생했습니다.",
        variant: "error",
      });
    },
  });

  const handleConfirmAddHotels = () => {
    const toAdd = candidateHotels.filter((h) => selectedCandidateIds.includes(h.id));
    const existingIds = new Set(hotelFields.map((f) => f.id));
    toAdd.forEach((h) => {
      if (!existingIds.has(h.id)) appendHotel({ ...h });
    });
    setIsAddingHotels(false);
    setCandidateHotels([]);
    setSelectedCandidateIds([]);
    pushToast({
      title: "호텔 추가 완료",
      description: `${toAdd.length}개의 호텔을 추가했습니다.`,
      variant: "success",
    });
  };

  const toggleCandidate = (hotelId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(hotelId) ? prev.filter((id) => id !== hotelId) : [...prev, hotelId],
    );
  };

  const onSubmit = (values: EditFormValues) => {
    if (updateMutation.isPending) return;
    updateMutation.mutate({
      title: values.title,
      imageUrl: values.imageUrl,
      serviceEnabled: values.serviceEnabled,
      startDate: new Date(`${values.startDate}T${values.startTime}:00`).toISOString(),
      endDate: new Date(`${values.endDate}T${values.endTime}:00`).toISOString(),
      hotels: values.hotels.map(normalizeHotelCard),
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
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateTitleMutation.mutate()}
              disabled={generateTitleMutation.isPending}
            >
              {generateTitleMutation.isPending ? "생성 중..." : "AI 타이틀 재생성"}
            </Button>
          </div>
          {generateTitleMutation.isError && (
            <p className="text-xs text-red-500">타이틀 생성에 실패했습니다. 다시 시도해 주세요.</p>
          )}

          {/* 이미지 URL + 미리보기 */}
          <div className="space-y-2">
            <Input
              label="이미지 URL"
              placeholder="https://example.com/image.jpg"
              error={errors.imageUrl?.message}
              {...register("imageUrl")}
            />
            <div className="relative h-48 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              {watch("imageUrl") ? (
                <img
                  src={watch("imageUrl")}
                  alt="미리보기"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display = ""; }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">이미지 없음</div>
              )}
              {isImageUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-sm font-medium text-white">처리 중...</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  업로드
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} disabled={isImageUploading} />
                </label>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isImageUploading}
                  className="flex items-center gap-1.5 rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  AI 재생성
                </button>
              </div>
            </div>
          </div>

          {/* 노출 기간 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">노출 기간</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker label="시작일" value={field.value} onChange={field.onChange} error={errors.startDate?.message} />
                  )}
                />
              </div>
              <div className="w-32 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">시간</label>
                <input type="time" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" {...register("startTime")} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker label="종료일" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              <div className="w-32 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">시간</label>
                <input type="time" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" {...register("endTime")} />
              </div>
            </div>
          </div>

          {/* 호텔 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                호텔 목록 <span className="ml-1 text-gray-400">({hotelFields.length}개)</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateHotelsMutation.mutate()}
                disabled={generateHotelsMutation.isPending || isAddingHotels}
              >
                {generateHotelsMutation.isPending ? "생성 중..." : "AI 호텔 추가"}
              </Button>
            </div>

            {/* 현재 호텔 목록 */}
            {hotelFields.length > 0 ? (
              <div className="space-y-2">
                {hotelFields.map((field, index) => (
                  <div key={field.fieldKey} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img src={field.imageUrl} alt={field.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-yellow-500">{"★".repeat(field.stars)}</span>
                        <span className="truncate text-sm font-medium text-gray-900">{field.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{field.location}</p>
                      <p className="text-xs font-medium text-gray-700">
                        {field.discountRate != null && field.discountRate > 0 && (
                          <span className="mr-1 text-red-500">{field.discountRate}%</span>
                        )}
                        {field.discountPrice.toLocaleString("ko-KR")}원~
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHotel(index)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      aria-label="호텔 삭제"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                등록된 호텔이 없습니다
              </p>
            )}

            {/* AI 호텔 후보 선택 UI */}
            {isAddingHotels && candidateHotels.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-800">
                    AI 생성 호텔 — {selectedCandidateIds.length}/{candidateHotels.length}개 선택
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedCandidateIds(candidateHotels.map((h) => h.id))} className="text-xs text-blue-600 hover:underline">전체 선택</button>
                    <button type="button" onClick={() => setSelectedCandidateIds([])} className="text-xs text-blue-600 hover:underline">전체 해제</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {candidateHotels.map((hotel) => {
                    const selected = selectedCandidateIds.includes(hotel.id);
                    return (
                      <button
                        key={hotel.id}
                        type="button"
                        onClick={() => toggleCandidate(hotel.id)}
                        className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                          selected ? "border-blue-400 bg-white" : "border-gray-200 bg-white opacity-60"
                        }`}
                      >
                        <input type="checkbox" readOnly checked={selected} className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600" />
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-yellow-500">{"★".repeat(hotel.stars)}</span>
                            <span className="truncate text-sm font-medium text-gray-900">{hotel.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{hotel.location}</p>
                          <p className="text-xs font-medium text-gray-700">
                            {hotel.discountRate != null && hotel.discountRate > 0 && (
                              <span className="mr-1 text-red-500">{hotel.discountRate}%</span>
                            )}
                            {hotel.discountPrice.toLocaleString("ko-KR")}원~
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setIsAddingHotels(false); setCandidateHotels([]); setSelectedCandidateIds([]); }}>취소</Button>
                  <Button type="button" variant="primary" size="sm" disabled={selectedCandidateIds.length === 0} onClick={handleConfirmAddHotels}>
                    {selectedCandidateIds.length}개 추가
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isSubmitSuccessful && updateMutation.isSuccess && (
            <p className="text-sm text-green-600">저장이 완료되었습니다.</p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-red-500">저장에 실패했습니다. 다시 시도해 주세요.</p>
          )}

          {/* 서비스 활성화 + 저장 버튼 */}
          <div className="flex items-center justify-end gap-4">
            <Controller
              control={control}
              name="serviceEnabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">서비스 활성화</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      field.value ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${field.value ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              )}
            />
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
        <Card><CardContent>
          <p className="text-center text-gray-500 py-8">컨텐츠를 불러오는 중...</p>
        </CardContent></Card>
      )}

      {isError && (
        <Card><CardContent>
          <p className="text-center text-red-500 py-8">데이터를 불러오는 데 실패했습니다.</p>
        </CardContent></Card>
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
