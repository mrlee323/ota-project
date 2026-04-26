"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import type { AutoConfig, UpdateAutoConfigInput, IntervalType } from "@/domain/admin/autoConfig";
import { updateAutoConfigInputSchema, getDefaultContentStartDate, getDefaultContentEndDate } from "@/domain/admin/autoConfig";
import { mockAutoConfigService } from "@/infrastructure/admin/mockAutoConfigService";
import { Card, CardContent } from "@/ui/components/Card";
import { DatePicker } from "@/ui/components/DatePicker";
import { Input } from "@/ui/components/Input";
import { Button } from "@/ui/components/Button";

// ─── 주기 타입 옵션 ─────────────────────────────────────────────────────────

const INTERVAL_TYPE_OPTIONS: { value: IntervalType; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

// ─── AutoConfigPanel 컴포넌트 ───────────────────────────────────────────────

/** 쇼케이스 자동 생성 설정 패널 */
export function AutoConfigPanel() {
  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<UpdateAutoConfigInput>({});
  const [nextDateStr, setNextDateStr] = useState("");
  const [contentStartDate, setContentStartDate] = useState("");
  const [contentStartTime, setContentStartTime] = useState("00:00");
  const [contentEndDate, setContentEndDate] = useState("");
  const [contentEndTime, setContentEndTime] = useState("23:59");
  const [newCityInput, setNewCityInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: config, isLoading, isError } = useQuery<AutoConfig>({
    queryKey: ["autoConfig"],
    queryFn: () => mockAutoConfigService.getAutoConfig(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAutoConfigInput) =>
      mockAutoConfigService.updateAutoConfig(input),
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

  /** 편집 모드 진입 */
  const handleStartEdit = () => {
    if (!config) return;
    setFormValues({
      enabled: config.enabled,
      intervalType: config.intervalType,
      intervalValue: config.intervalValue,
      suggestedCities: config.suggestedCities,
    });
    // ISO → date만 추출 (시간은 08:00 고정)
    const d = new Date(config.nextGenerationDate);
    setNextDateStr(format(d, "yyyy-MM-dd"));
    setContentStartDate(format(new Date(config.contentStartDate), "yyyy-MM-dd"));
    setContentStartTime(format(new Date(config.contentStartDate), "HH:mm"));
    setContentEndDate(format(new Date(config.contentEndDate), "yyyy-MM-dd"));
    setContentEndTime(format(new Date(config.contentEndDate), "HH:mm"));
    setValidationErrors({});
    setIsEditing(true);
  };

  /** 편집 취소 */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormValues({});
    setNewCityInput("");
    setContentStartDate("");
    setContentStartTime("00:00");
    setContentEndDate("");
    setContentEndTime("23:59");
    setValidationErrors({});
  };

  /** 도시 추가 */
  const handleAddCity = () => {
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    const current = formValues.suggestedCities ?? [];
    if (current.includes(trimmed)) {
      setNewCityInput("");
      return;
    }
    setFormValues((prev) => ({
      ...prev,
      suggestedCities: [...(prev.suggestedCities ?? []), trimmed],
    }));
    setNewCityInput("");
  };

  /** 저장 핸들러 */
  const handleSave = () => {
    // nextGenerationDate: 날짜 + 08:00 고정
    const nextGenIso = nextDateStr
      ? new Date(`${nextDateStr}T08:00:00`).toISOString()
      : undefined;
    const contentStartIso = contentStartDate
      ? new Date(`${contentStartDate}T${contentStartTime}:00`).toISOString()
      : undefined;
    const contentEndIso = contentEndDate
      ? new Date(`${contentEndDate}T${contentEndTime}:00`).toISOString()
      : undefined;

    const payload = { ...formValues, nextGenerationDate: nextGenIso, contentStartDate: contentStartIso, contentEndDate: contentEndIso };
    const result = updateAutoConfigInputSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] = issue.message;
      }
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    updateMutation.mutate(result.data, { onSuccess: () => setIsEditing(false) });
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
        {/* 헤더: 타이틀 + ON/OFF 태그 + 다음 생성일 + 펼치기/접기 */}
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
                {config.suggestedCities.length > 0 && (
                  <> · {config.suggestedCities.join(", ")}</>
                )}
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

        {/* 펼쳐진 내용 */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* 읽기 모드 */}
            {!isEditing && (
              <div className="space-y-3 text-sm">
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
                      {format(new Date(config.contentStartDate), "yyyy-MM-dd HH:mm:ss")} ~ {format(new Date(config.contentEndDate), "yyyy-MM-dd HH:mm:ss")}
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
                    <p className="mt-1 text-xs text-gray-400">AI가 추출한 추천 도시입니다. 수정 버튼을 눌러 변경할 수 있습니다.</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>수정</Button>
                </div>
              </div>
            )}

            {/* 편집 모드 */}
            {isEditing && (
              <div className="space-y-4">
                {/* ON/OFF 토글 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">자동 생성 활성화</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formValues.enabled ?? false}
                    onClick={() => setFormValues((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      formValues.enabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      formValues.enabled ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                {/* 주기 타입 + 값 */}
                <div className="flex gap-3">
                  <div className="w-full space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">주기 타입</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      value={formValues.intervalType ?? "day"}
                      onChange={(e) => {
                        const newType = e.target.value as IntervalType;
                        setFormValues((prev) => ({ ...prev, intervalType: newType }));
                        // intervalType 변경 시 노출 기간 디폴트 재계산
                        if (nextDateStr) {
                          const genDate = new Date(`${nextDateStr}T08:00:00`);
                          const newValue = formValues.intervalValue ?? 1;
                          const start = getDefaultContentStartDate(genDate, newType);
                          const end = getDefaultContentEndDate(start, newType, newValue);
                          setContentStartDate(format(start, "yyyy-MM-dd"));
                          setContentStartTime(format(start, "HH:mm"));
                          setContentEndDate(format(end, "yyyy-MM-dd"));
                          setContentEndTime(format(end, "HH:mm"));
                        }
                      }}
                    >
                      {INTERVAL_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="주기 값"
                    type="number"
                    min={1}
                    value={formValues.intervalValue ?? ""}
                    onChange={(e) => {
                      const newValue = e.target.value ? Number(e.target.value) : undefined;
                      setFormValues((prev) => ({ ...prev, intervalValue: newValue }));
                      // intervalValue 변경 시 노출 기간 디폴트 재계산
                      if (nextDateStr && newValue) {
                        const genDate = new Date(`${nextDateStr}T08:00:00`);
                        const type = formValues.intervalType ?? "day";
                        const start = getDefaultContentStartDate(genDate, type);
                        const end = getDefaultContentEndDate(start, type, newValue);
                        setContentStartDate(format(start, "yyyy-MM-dd"));
                        setContentStartTime(format(start, "HH:mm"));
                        setContentEndDate(format(end, "yyyy-MM-dd"));
                        setContentEndTime(format(end, "HH:mm"));
                      }
                    }}
                    error={validationErrors["intervalValue"]}
                  />
                </div>
                {/* 다음 생성 대상 도시 (추가/삭제 가능) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">다음 생성 대상 도시</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] rounded-md border border-gray-300 bg-white p-2">
                    {(formValues.suggestedCities ?? []).map((city) => (
                      <span key={city} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {city}
                        <button
                          type="button"
                          onClick={() => setFormValues((prev) => ({
                            ...prev,
                            suggestedCities: (prev.suggestedCities ?? []).filter((c) => c !== city),
                          }))}
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
                    <Button variant="outline" size="sm" onClick={handleAddCity} className="shrink-0">
                      추가
                    </Button>
                  </div>
                </div>
                {/* 다음 생성일 (날짜만, 시간은 08:00 고정) */}
                <DatePicker
                  label="다음 생성일"
                  value={nextDateStr}
                  onChange={(date) => setNextDateStr(date)}
                  error={validationErrors["nextGenerationDate"]}
                />
                <p className="text-xs text-gray-400 -mt-2">오전 8시에 자동 생성됩니다</p>
                {/* 컨텐츠 노출 기간 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">컨텐츠 노출 기간</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <DatePicker
                        label="시작일"
                        value={contentStartDate}
                        onChange={(date) => setContentStartDate(date)}
                      />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">시간</label>
                      <input
                        type="time"
                        value={contentStartTime}
                        onChange={(e) => setContentStartTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <DatePicker
                        label="종료일"
                        value={contentEndDate}
                        onChange={(date) => setContentEndDate(date)}
                      />
                    </div>
                    <div className="w-32 space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">시간</label>
                      <input
                        type="time"
                        value={contentEndTime}
                        onChange={(e) => setContentEndTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {validationErrors["contentStartDate"] && (
                    <p className="text-xs text-red-500">{validationErrors["contentStartDate"]}</p>
                  )}
                </div>
                {validationErrors["nextGenerationDate"] && (
                  <p className="text-xs text-red-500">{validationErrors["nextGenerationDate"]}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>취소</Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
