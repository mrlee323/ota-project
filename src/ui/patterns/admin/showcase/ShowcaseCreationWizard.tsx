"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMachine } from "@xstate/react";
import { showcaseCreationMachine } from "@/application/admin/showcaseCreationMachine";
import { mockShowcaseService } from "@/infrastructure/admin/mockShowcaseService";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { CityInputStep } from "./steps/CityInputStep";
import { PeriodSettingStep } from "./steps/PeriodSettingStep";
import { TitleEditStep } from "./steps/TitleEditStep";
import { ImageReviewStep } from "./steps/ImageReviewStep";
import { HotelSelectStep } from "./steps/HotelSelectStep";

// ─── 스텝 정의 ──────────────────────────────────────────────────────────────

/** 위저드 스텝 정보 (6단계) */
const STEPS = [
  { label: "도시 입력", number: 1 },
  { label: "기간 설정", number: 2 },
  { label: "타이틀 편집", number: 3 },
  { label: "이미지 확인", number: 4 },
  { label: "호텔 선택", number: 5 },
  { label: "완료", number: 6 },
] as const;

/** 상태 → 스텝 번호 매핑 */
const stateStepMap: Record<string, number> = {
  idle: 1,
  inputtingCity: 1,
  settingPeriod: 2,
  generatingTitle: 3,
  editingTitle: 3,
  generatingImage: 4,
  reviewingImage: 4,
  generatingHotels: 5,
  selectingHotels: 5,
  saving: 6,
  done: 6,
  error: 0,
};

/** 현재 상태의 스텝 번호 반환 */
const getStepNumber = (stateValue: string): number =>
  stateStepMap[stateValue] ?? 0;

/** generating 상태 여부 확인 */
const isGeneratingState = (stateValue: string): boolean =>
  ["generatingTitle", "generatingImage", "generatingHotels", "saving"].includes(
    stateValue,
  );

/** generating 상태별 로딩 메시지 */
const getLoadingMessage = (stateValue: string): string => {
  const messages: Record<string, string> = {
    generatingTitle: "타이틀을 생성하고 있습니다...",
    generatingImage: "이미지를 생성하고 있습니다...",
    generatingHotels: "호텔 목록을 생성하고 있습니다...",
    saving: "쇼케이스를 저장하고 있습니다...",
  };
  return messages[stateValue] ?? "처리 중입니다...";
};

// ─── 스텝 인디케이터 컴포넌트 ────────────────────────────────────────────────

/** 위저드 진행 상태 표시 (6단계) */
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="위저드 진행 상태" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <li key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                {/* 스텝 번호 원형 */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? "✓" : step.number}
                </div>
                {/* 스텝 라벨 */}
                <span
                  className={`text-xs ${
                    isActive
                      ? "font-semibold text-gray-900"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* 스텝 간 연결선 */}
              {step.number < STEPS.length && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    step.number < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── 로딩 인디케이터 컴포넌트 ────────────────────────────────────────────────

/** 생성 중 로딩 표시 */
function LoadingIndicator({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* 스피너 애니메이션 */}
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// ─── 메인 위저드 컴포넌트 ────────────────────────────────────────────────────

/** 쇼케이스 생성 위저드 - XState v5 상태 머신 기반 단계별 플로우 */
export function ShowcaseCreationWizard() {
  const [state, send] = useMachine(showcaseCreationMachine, {
    input: { showcaseService: mockShowcaseService },
  });

  /** 현재 상태값 (문자열) */
  const stateValue = state.value as string;
  const currentStep = getStepNumber(stateValue);
  const {
    cityName,
    title,
    imageUrl,
    hotels,
    selectedHotelIds,
    startDate,
    endDate,
    errorMessage,
  } = state.context;

  // idle 상태에서 자동으로 START 이벤트 전송
  useEffect(() => {
    if (state.matches("idle")) {
      send({ type: "START" });
    }
  }, [state, send]);

  // ─── 상태별 컨텐츠 렌더링 ──────────────────────────────────────────────

  /** 현재 상태에 맞는 스텝 컨텐츠 반환 */
  const renderStepContent = () => {
    // 에러 상태
    if (state.matches("error")) {
      return (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl text-red-600">!</span>
          </div>
          <p className="text-sm text-red-600">
            {errorMessage || "오류가 발생했습니다."}
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => send({ type: "RETRY" })}>
              재시도
            </Button>
            <Button variant="outline" onClick={() => send({ type: "RESET" })}>
              처음부터 다시
            </Button>
          </div>
        </div>
      );
    }

    // 완료 상태
    if (state.matches("done")) {
      return (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl text-green-600">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            쇼케이스가 생성되었습니다!
          </h3>
          <p className="text-sm text-gray-500">
            &quot;{title}&quot; 쇼케이스가 성공적으로 저장되었습니다.
          </p>
          <Link
            href="/admin/content/showcase"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      );
    }

    // 로딩(generating) 상태
    if (isGeneratingState(stateValue)) {
      return <LoadingIndicator message={getLoadingMessage(stateValue)} />;
    }

    // 도시 입력 (idle → inputtingCity 자동 전이 후 렌더링)
    if (state.matches("idle") || state.matches("inputtingCity")) {
      return (
        <CityInputStep
          onSubmit={(selectedCity) =>
            send({ type: "SUBMIT_CITY", cityName: selectedCity })
          }
        />
      );
    }

    // 기간 설정
    if (state.matches("settingPeriod")) {
      return (
        <PeriodSettingStep
          onSubmit={(start, end) =>
            send({ type: "SUBMIT_PERIOD", startDate: start, endDate: end })
          }
          onBack={() => send({ type: "BACK" })}
        />
      );
    }

    // 타이틀 편집
    if (state.matches("editingTitle")) {
      return (
        <TitleEditStep
          title={title}
          cityName={cityName}
          onConfirm={() => send({ type: "CONFIRM" })}
          onUpdateTitle={(newTitle) =>
            send({ type: "UPDATE_TITLE", title: newTitle })
          }
          onBack={() => send({ type: "BACK" })}
        />
      );
    }

    // 이미지 확인
    if (state.matches("reviewingImage")) {
      return (
        <ImageReviewStep
          imageUrl={imageUrl}
          title={title}
          onConfirm={() => send({ type: "CONFIRM" })}
          onRegenerate={() => send({ type: "REGENERATE_IMAGE" })}
          onBack={() => send({ type: "BACK" })}
        />
      );
    }

    // 호텔 선택
    if (state.matches("selectingHotels")) {
      return (
        <HotelSelectStep
          hotels={hotels}
          selectedHotelIds={selectedHotelIds}
          onToggleHotel={(hotelId) =>
            send({ type: "TOGGLE_HOTEL", hotelId })
          }
          onSelectAll={() => send({ type: "SELECT_ALL_HOTELS" })}
          onDeselectAll={() => send({ type: "DESELECT_ALL_HOTELS" })}
          onConfirm={() => send({ type: "CONFIRM" })}
          onBack={() => send({ type: "BACK" })}
        />
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          새 쇼케이스 생성
        </h1>
        {!state.matches("done") && (
          <Link
            href="/admin/content/showcase"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </Link>
        )}
      </div>

      {/* 스텝 인디케이터 (에러/완료 상태가 아닐 때만 표시) */}
      {currentStep > 0 && <StepIndicator currentStep={currentStep} />}

      {/* 메인 컨텐츠 카드 */}
      <Card>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>
    </div>
  );
}
