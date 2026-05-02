"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import type { AutoConfig, UpdateAutoConfigInput, IntervalType } from "@/domain/admin/autoConfig";
import { intervalTypeSchema, getDefaultContentStartDate, getDefaultContentEndDate } from "@/domain/admin/autoConfig";
import { autoConfigService } from "@/infrastructure/admin/autoConfigServiceClient";
import { Card, CardContent } from "@/ui/components/Card";
import { DatePicker } from "@/ui/components/DatePicker";
import { Input } from "@/ui/components/Input";
import { Button } from "@/ui/components/Button";

// ─── 폼 스키마 ───────────────────────────────────────────────────────────────

const autoConfigFormSchema = z
  .object({
    promoTitle: z.string().min(1, "프로모 타이틀을 입력해 주세요"),
    enabled: z.boolean(),
    intervalType: intervalTypeSchema,
    intervalValue: z.coerce.number().int().positive("양의 정수를 입력해 주세요"),
    nextDate: z.string().min(1, "날짜를 선택해 주세요"),
    suggestedCities: z.array(z.object({ city: z.string().min(1) })),
    contentStartDate: z.string().min(1, "시작일을 선택해 주세요"),
    contentStartTime: z.string().min(1),
    contentEndDate: z.string().min(1, "종료일을 선택해 주세요"),
    contentEndTime: z.string().min(1),
  })
  .refine(
    (d) =>
      new Date(`${d.contentStartDate}T${d.contentStartTime}:00`) <
      new Date(`${d.contentEndDate}T${d.contentEndTime}:00`),
    { message: "시작일시는 종료일시보다 이전이어야 합니다", path: ["contentStartDate"] },
  );

type AutoConfigFormValues = z.infer<typeof autoConfigFormSchema>;

// ─── 주기 타입 옵션 ─────────────────────────────────────────────────────────

const INTERVAL_TYPE_OPTIONS: { value: IntervalType; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

// ─── 편집 폼 컴포넌트 (config가 있을 때만 마운트) ───────────────────────────

interface AutoConfigEditFormProps {
  config: AutoConfig;
  onSave: (input: UpdateAutoConfigInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function AutoConfigEditForm({ config, onSave, onCancel, isSaving }: AutoConfigEditFormProps) {
  const [newCityInput, setNewCityInput] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AutoConfigFormValues>({
    resolver: zodResolver(autoConfigFormSchema),
    defaultValues: {
      promoTitle: config.promoTitle,
      enabled: config.enabled,
      intervalType: config.intervalType,
      intervalValue: config.intervalValue,
      nextDate: format(new Date(config.nextGenerationDate), "yyyy-MM-dd"),
      suggestedCities: config.suggestedCities.map((city) => ({ city })),
      contentStartDate: format(new Date(config.contentStartDate), "yyyy-MM-dd"),
      contentStartTime: format(new Date(config.contentStartDate), "HH:mm"),
      contentEndDate: format(new Date(config.contentEndDate), "yyyy-MM-dd"),
      contentEndTime: format(new Date(config.contentEndDate), "HH:mm"),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "suggestedCities" });

  const intervalType = watch("intervalType");
  const intervalValue = watch("intervalValue");
  const nextDate = watch("nextDate");

  const recalcDates = (type: IntervalType, value: number, dateStr: string) => {
    if (!dateStr || !value) return;
    const genDate = new Date(`${dateStr}T08:00:00`);
    const start = getDefaultContentStartDate(genDate, type);
    const end = getDefaultContentEndDate(start, type, value);
    setValue("contentStartDate", format(start, "yyyy-MM-dd"));
    setValue("contentStartTime", format(start, "HH:mm"));
    setValue("contentEndDate", format(end, "yyyy-MM-dd"));
    setValue("contentEndTime", format(end, "HH:mm"));
  };

  const handleAddCity = () => {
    const trimmed = newCityInput.trim();
    if (!trimmed || fields.some((f) => f.city === trimmed)) {
      setNewCityInput("");
      return;
    }
    append({ city: trimmed });
    setNewCityInput("");
  };

  const onSubmit = (values: AutoConfigFormValues) => {
    onSave({
      promoTitle: values.promoTitle,
      enabled: values.enabled,
      intervalType: values.intervalType,
      intervalValue: values.intervalValue,
      nextGenerationDate: new Date(`${values.nextDate}T08:00:00`).toISOString(),
      suggestedCities: values.suggestedCities.map((f) => f.city),
      contentStartDate: new Date(`${values.contentStartDate}T${values.contentStartTime}:00`).toISOString(),
      contentEndDate: new Date(`${values.contentEndDate}T${values.contentEndTime}:00`).toISOString(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {/* 프로모 타이틀 */}
      <Input
        label="프로모 타이틀"
        placeholder="쇼케이스 섹션 상단에 표시될 타이틀"
        error={errors.promoTitle?.message}
        {...register("promoTitle")}
      />

      {/* ON/OFF 토글 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">자동 생성 활성화</span>
        <Controller
          control={control}
          name="enabled"
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

      {/* 주기 타입 + 값 */}
      <div className="flex gap-3">
        <div className="w-full space-y-1.5">
          <label className="text-sm font-medium text-gray-700">주기 타입</label>
          <Controller
            control={control}
            name="intervalType"
            render={({ field }) => (
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                value={field.value}
                onChange={(e) => {
                  const newType = e.target.value as IntervalType;
                  field.onChange(newType);
                  recalcDates(newType, intervalValue, nextDate);
                }}
              >
                {INTERVAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          />
        </div>
        <Input
          label="주기 값"
          type="number"
          min={1}
          error={errors.intervalValue?.message}
          {...register("intervalValue", {
            onChange: (e) => recalcDates(intervalType, Number(e.target.value), nextDate),
          })}
        />
      </div>

      {/* 자동 생성 대상 도시 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">자동 생성 대상 도시</label>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] rounded-md border border-gray-300 bg-white p-2">
          {fields.map((field, index) => (
            <span
              key={field.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
            >
              {field.city}
              <button
                type="button"
                onClick={() => remove(index)}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="도시명 입력 후 추가"
            value={newCityInput}
            onChange={(e) => setNewCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCity();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddCity} className="shrink-0">
            추가
          </Button>
        </div>
      </div>

      {/* 다음 생성일 */}
      <Controller
        control={control}
        name="nextDate"
        render={({ field }) => (
          <DatePicker
            label="다음 생성일"
            value={field.value}
            onChange={(date) => {
              field.onChange(date);
              recalcDates(intervalType, intervalValue, date);
            }}
            error={errors.nextDate?.message}
          />
        )}
      />
      <p className="text-xs text-gray-400 -mt-2">지정한 주기에 맞춰 다음 쇼케이스가 미리 생성됩니다</p>

      {/* 컨텐츠 노출 기간 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">컨텐츠 노출 기간</label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Controller
              control={control}
              name="contentStartDate"
              render={({ field }) => (
                <DatePicker
                  label="시작일"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.contentStartDate?.message}
                />
              )}
            />
          </div>
          <div className="w-32 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">시간</label>
            <input
              type="time"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              {...register("contentStartTime")}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Controller
              control={control}
              name="contentEndDate"
              render={({ field }) => (
                <DatePicker
                  label="종료일"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="w-32 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">시간</label>
            <input
              type="time"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              {...register("contentEndTime")}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}

// ─── AutoConfigPanel 컴포넌트 ───────────────────────────────────────────────

interface GenerateResult {
  ok: boolean;
  eventIds: string[];
}

export function AutoConfigPanel() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { data: config, isLoading, isError } = useQuery<AutoConfig>({
    queryKey: ["autoConfig"],
    queryFn: () => autoConfigService.getAutoConfig(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAutoConfigInput) => autoConfigService.updateAutoConfig(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["autoConfig"] });
      const previous = queryClient.getQueryData<AutoConfig>(["autoConfig"]);
      if (previous) {
        queryClient.setQueryData<AutoConfig>(["autoConfig"], { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["autoConfig"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["autoConfig"] });
    },
  });

  const handleSave = (input: UpdateAutoConfigInput) => {
    updateMutation.mutate(input, { onSuccess: () => setIsEditing(false) });
  };

  const handleGenerateNow = async () => {
    if (!config || config.suggestedCities.length === 0) return;
    setGenerateStatus("loading");
    try {
      const res = await fetch("/api/admin/showcase/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cities: config.suggestedCities,
          startDate: config.contentStartDate,
          endDate: config.contentEndDate,
        }),
      });
      const data = (await res.json()) as GenerateResult;
      if (!res.ok || !data.ok) throw new Error("생성 요청 실패");
      setGenerateStatus("success");
      setTimeout(() => setGenerateStatus("idle"), 4000);
    } catch {
      setGenerateStatus("error");
      setTimeout(() => setGenerateStatus("idle"), 4000);
    }
  };

  if (isLoading) {
    return (
      <Card><CardContent>
        <p className="text-center text-gray-500 py-3 text-sm">자동 생성 설정을 불러오는 중...</p>
      </CardContent></Card>
    );
  }

  if (isError || !config) {
    return (
      <Card><CardContent>
        <p className="text-center text-red-500 py-3 text-sm">설정을 불러오는 데 실패했습니다.</p>
      </CardContent></Card>
    );
  }

  const intervalLabel = INTERVAL_TYPE_OPTIONS.find((o) => o.value === config.intervalType)?.label ?? config.intervalType;

  return (
    <Card>
      <CardContent className="py-3 px-4">
        {/* 헤더 */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">자동 생성</h2>
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              config.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {config.enabled ? "ON" : "OFF"}
            </span>
            {config.enabled && (
              <span className="text-xs text-gray-400">
                다음 생성: {format(new Date(config.nextGenerationDate), "M월 d일 (EEE) HH:mm", { locale: ko })}
                {config.suggestedCities.length > 0 && <> · {config.suggestedCities.join(", ")}</>}
                {" · "}노출: {format(new Date(config.contentStartDate), "M/d")}~{format(new Date(config.contentEndDate), "M/d")}
              </span>
            )}
          </div>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {!isEditing && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">프로모 타이틀</span>
                  <span className="text-gray-900">{config.promoTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">상태</span>
                  <span className={config.enabled ? "text-green-600 font-medium" : "text-gray-500"}>
                    {config.enabled ? "활성화" : "비활성화"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">생성 주기</span>
                  <span className="text-gray-900">{config.intervalValue} {intervalLabel}</span>
                </div>
                {config.enabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">다음 생성일</span>
                    <span className="text-gray-900">
                      {format(new Date(config.nextGenerationDate), "yyyy년 M월 d일 (EEE) HH:mm", { locale: ko })}
                    </span>
                  </div>
                )}
                {config.enabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">컨텐츠 노출 기간</span>
                    <span className="text-gray-900">
                      {format(new Date(config.contentStartDate), "yyyy-MM-dd HH:mm")} ~ {format(new Date(config.contentEndDate), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                )}
                {config.suggestedCities.length > 0 && (
                  <div>
                    <span className="text-gray-500">다음 생성 대상 도시</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {config.suggestedCities.map((city) => (
                        <span key={city} className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    {generateStatus === "success" && (
                      <span className="text-green-600 font-medium">생성 요청이 전송됐습니다</span>
                    )}
                    {generateStatus === "error" && (
                      <span className="text-red-500">생성 요청에 실패했습니다</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateNow}
                      disabled={generateStatus === "loading" || config.suggestedCities.length === 0}
                    >
                      {generateStatus === "loading" ? "요청 중..." : "지금 생성"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>수정</Button>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <AutoConfigEditForm
                key={config.contentStartDate}
                config={config}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                isSaving={updateMutation.isPending}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
