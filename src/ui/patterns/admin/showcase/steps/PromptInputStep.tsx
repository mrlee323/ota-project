"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/ui/components/Button";

const schema = z.object({
  prompt: z.string(),
});

type FormValues = z.infer<typeof schema>;

const PROMPT_PRESETS = [
  { label: "럭셔리", value: "럭셔리, 고급스러운 분위기, 프리미엄 서비스" },
  { label: "미니멀", value: "미니멀, 깔끔하고 모던한 감성" },
  { label: "빈티지", value: "빈티지, 레트로 감성, 클래식한 분위기" },
  { label: "현대적인", value: "현대적인, 세련된 도심 호텔" },
  { label: "로맨틱", value: "로맨틱, 커플 여행, 감성적인 분위기" },
  { label: "비즈니스", value: "비즈니스 출장객, 효율적이고 편리한 위치" },
];

interface PromptInputStepProps {
  cityName: string;
  onSubmit: (prompt: string) => void;
  onBack?: () => void;
}

export function PromptInputStep({ cityName, onSubmit, onBack }: PromptInputStepProps) {
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { prompt: "" },
  });

  const currentPrompt = watch("prompt");

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">AI 생성 방향을 설정하세요</h2>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{cityName}</span> 쇼케이스의 테마나 분위기를 입력하면
          타이틀과 이미지 생성에 반영됩니다.
        </p>
      </div>

      <form
        className="mx-auto max-w-sm space-y-4"
        onSubmit={handleSubmit((v) => onSubmit(v.prompt.trim()))}
      >
        {/* 프롬프트 입력 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            프롬프트 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            rows={3}
            placeholder="예: 벚꽃 시즌 감성 숙소, 비즈니스 출장객 위주..."
            className="flex w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            {...register("prompt")}
          />
        </div>

        {/* 프리셋 */}
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400">분위기 프리셋</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setValue("prompt", preset.value)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  currentPrompt === preset.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {onBack && (
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              이전
            </Button>
          )}
          <Button type="button" variant="outline" className="flex-1" onClick={() => onSubmit("")}>
            건너뛰기
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            다음
          </Button>
        </div>
      </form>
    </div>
  );
}
