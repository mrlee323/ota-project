"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/ui/components/Button";
import { DateRangePicker } from "@/ui/components/DateRangePicker";

const schema = z
  .object({
    startDate: z.string().min(1, "시작일을 선택해 주세요"),
    endDate: z.string().min(1, "종료일을 선택해 주세요"),
  })
  .refine((d) => new Date(d.startDate) < new Date(d.endDate), {
    message: "시작일은 종료일보다 이전이어야 합니다",
    path: ["startDate"],
  });

type FormValues = z.infer<typeof schema>;

interface PeriodSettingStepProps {
  onSubmit: (startDate: string, endDate: string) => void;
  onBack?: () => void;
}

export function PeriodSettingStep({ onSubmit, onBack }: PeriodSettingStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startDate: "", endDate: "" },
  });

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">노출 기간을 설정하세요</h2>
        <p className="mt-1 text-sm text-gray-500">쇼케이스가 서비스에 노출될 기간을 설정합니다.</p>
      </div>
      <form
        className="mx-auto max-w-sm space-y-4"
        onSubmit={handleSubmit((v) =>
          onSubmit(
            new Date(v.startDate).toISOString(),
            new Date(v.endDate).toISOString(),
          )
        )}
      >
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
        <div className="flex gap-3">
          {onBack && (
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              이전
            </Button>
          )}
          <Button type="submit" variant="primary" className="flex-1">
            다음
          </Button>
        </div>
      </form>
    </div>
  );
}
