"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

const schema = z.object({
  cityName: z.string().min(1, "도시명을 입력해 주세요"),
});

type FormValues = z.infer<typeof schema>;

interface CityInputStepProps {
  onSubmit: (cityName: string) => void;
}

export function CityInputStep({ onSubmit }: CityInputStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cityName: "" },
  });

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">도시를 입력하세요</h2>
        <p className="mt-1 text-sm text-gray-500">쇼케이스를 생성할 도시명을 입력합니다.</p>
      </div>
      <form
        className="mx-auto max-w-sm space-y-4"
        onSubmit={handleSubmit((v) => onSubmit(v.cityName.trim()))}
      >
        <Input
          label="도시명"
          placeholder="예: 서울, 도쿄, 방콕"
          error={errors.cityName?.message}
          {...register("cityName")}
        />
        <Button type="submit" variant="primary" className="w-full">
          다음
        </Button>
      </form>
    </div>
  );
}
