"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { buildShowcaseCreationKey } from "@/domain/admin/showcaseCreation";
import type {
  ShowcaseCreationCityStatus,
} from "@/domain/admin/showcaseCreation";
import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import { showcaseService } from "@/infrastructure/admin/showcaseServiceClient";
import {
  generateShowcaseHotels,
  generateShowcaseImage,
  generateShowcaseTitle,
} from "@/infrastructure/admin/showcaseGeneration";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { DatePicker } from "@/ui/components/DatePicker";
import { Modal } from "@/ui/components/Modal";
import { Input } from "@/ui/components/Input";
import { ToastProvider, useToast } from "@/ui/components/Toast";

type GenerationMode = "all" | "title" | "image" | "hotels";

interface CityDraftState {
  id: string;
  cityName: string;
  prompt: string;
  startDate: string;
  endDate: string;
  title: string;
  imageUrl: string;
  hotels: ShowcaseHotelCard[];
  status: ShowcaseCreationCityStatus;
  titleGenerationKey?: string;
  imageGenerationKey?: string;
  hotelsGenerationKey?: string;
  savedShowcaseId?: string;
  errorMessage?: string;
  contentVisible: boolean;
}

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80";
function generateLocalId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface HotelDraftState {
  name: string;
  location: string;
  imageUrl: string;
  stars: string;
  originalPrice: string;
  discountPrice: string;
  discountRate: string;
  isAppDiscount: boolean;
  taxIncluded: boolean;
  badges: string;
}

function createEmptyHotelDraft(): HotelDraftState {
  return {
    name: "",
    location: "",
    imageUrl: "",
    stars: "",
    originalPrice: "",
    discountPrice: "",
    discountRate: "",
    isAppDiscount: false,
    taxIncluded: true,
    badges: "",
  };
}

function isValidHotelDraft(draft: HotelDraftState): boolean {
  if (!draft.name.trim() || !draft.location.trim() || !draft.imageUrl.trim()) return false;
  const stars = Number(draft.stars);
  const originalPrice = Number(draft.originalPrice);
  const discountPrice = Number(draft.discountPrice);
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return false;
  if (!Number.isFinite(originalPrice) || originalPrice < 0) return false;
  if (!Number.isFinite(discountPrice) || discountPrice < 0) return false;
  if (draft.discountRate.trim() !== "") {
    const discountRate = Number(draft.discountRate);
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) return false;
  }
  try {
    new URL(draft.imageUrl.trim());
  } catch {
    return false;
  }
  return true;
}

function hotelDraftToCard(draft: HotelDraftState): ShowcaseHotelCard {
  return {
    id: `manual-${generateLocalId()}`,
    name: draft.name.trim(),
    location: draft.location.trim(),
    imageUrl: draft.imageUrl.trim(),
    stars: Number(draft.stars),
    originalPrice: Number(draft.originalPrice),
    discountPrice: Number(draft.discountPrice),
    discountRate:
      draft.discountRate.trim() === "" ? undefined : Number(draft.discountRate),
    isAppDiscount: draft.isAppDiscount,
    taxIncluded: draft.taxIncluded,
    badges: parseBadges(draft.badges),
  };
}

function createEmptyCityDraft(): CityDraftState {
  const today = format(new Date(), "yyyy-MM-dd");
  return {
    id: generateLocalId(),
    cityName: "",
    prompt: "",
    startDate: today,
    endDate: format(addDays(new Date(), 6), "yyyy-MM-dd"),
    title: "",
    imageUrl: "",
    hotels: [],
    status: "draft",
    contentVisible: false,
  };
}

function cloneCityDraft(city: CityDraftState): CityDraftState {
  return {
    ...city,
    id: generateLocalId(),
    savedShowcaseId: undefined,
    errorMessage: undefined,
    contentVisible: false,
    status: city.status === "saved" ? "generated" : city.status,
  };
}

function toIsoStart(date: string): string {
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function toIsoEnd(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function getScopeKey(city: CityDraftState): string {
  return buildShowcaseCreationKey({
    cityName: city.cityName,
    prompt: city.prompt || undefined,
    startDate: city.startDate,
    endDate: city.endDate,
  });
}

function isSectionGenerated(city: CityDraftState, sectionKey?: string): boolean {
  return sectionKey === getScopeKey(city);
}

function hasGeneratedContent(city: CityDraftState): boolean {
  return Boolean(
    city.savedShowcaseId ||
      city.title.trim() ||
      city.imageUrl.trim() ||
      city.hotels.length > 0 ||
      city.titleGenerationKey ||
      city.imageGenerationKey ||
      city.hotelsGenerationKey ||
      city.status === "generated" ||
      city.status === "saved",
  );
}

function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function isCityReadyToSave(city: CityDraftState): boolean {
  return Boolean(
    city.cityName.trim() &&
      city.title.trim() &&
      city.imageUrl.trim() &&
      !city.errorMessage &&
      isSectionGenerated(city, city.titleGenerationKey) &&
      isSectionGenerated(city, city.imageGenerationKey) &&
      isSectionGenerated(city, city.hotelsGenerationKey),
  );
}

function getStatusLabel(city: CityDraftState): string {
  const isStale =
    hasGeneratedContent(city) &&
    (!isSectionGenerated(city, city.titleGenerationKey) ||
      !isSectionGenerated(city, city.imageGenerationKey) ||
      !isSectionGenerated(city, city.hotelsGenerationKey));

  if (isStale) return "다시 생성 필요";
  if (city.status === "saved") return "저장됨";
  if (city.status === "generated") return "생성됨";
  if (city.status === "error") return "오류";
  return "초안";
}

function statusBadgeClass(city: CityDraftState): string {
  const isStale =
    hasGeneratedContent(city) &&
    (!isSectionGenerated(city, city.titleGenerationKey) ||
      !isSectionGenerated(city, city.imageGenerationKey) ||
      !isSectionGenerated(city, city.hotelsGenerationKey));

  if (isStale) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (city.status === "saved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (city.status === "generated") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (city.status === "error") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-600";
}

function parseBadges(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

interface HotelEditorProps {
  cityId: string;
  hotel: ShowcaseHotelCard;
  hotelIndex: number;
  onChange: (hotelId: string, patch: Partial<ShowcaseHotelCard>) => void;
  onRemove: (hotelId: string) => void;
  disabled?: boolean;
}

function HotelEditor({
  cityId,
  hotel,
  hotelIndex,
  onChange,
  onRemove,
  disabled = false,
}: HotelEditorProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            호텔 {hotelIndex + 1}
          </p>
          <p className="text-xs text-gray-500">{cityId}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onRemove(hotel.id)}
        >
          삭제
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="호텔명"
          value={hotel.name}
          disabled={disabled}
          onChange={(event) => onChange(hotel.id, { name: event.target.value })}
        />
        <Input
          label="지역"
          value={hotel.location}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, { location: event.target.value })
          }
        />
        <Input
          label="이미지 URL"
          value={hotel.imageUrl}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, { imageUrl: event.target.value })
          }
        />
        <Input
          label="별점"
          type="number"
          min={1}
          max={5}
          value={hotel.stars}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, {
              stars: Math.min(5, Math.max(1, Number(event.target.value) || 1)),
            })
          }
        />
        <Input
          label="원가"
          type="number"
          min={0}
          value={hotel.originalPrice}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, {
              originalPrice: Number(event.target.value) || 0,
            })
          }
        />
        <Input
          label="할인가"
          type="number"
          min={0}
          value={hotel.discountPrice}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, {
              discountPrice: Number(event.target.value) || 0,
            })
          }
        />
        <Input
          label="할인율"
          type="number"
          min={0}
          max={100}
          value={hotel.discountRate ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, {
              discountRate:
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
            })
          }
        />
        <Input
          label="뱃지"
          value={hotel.badges.join(", ")}
          disabled={disabled}
          onChange={(event) =>
            onChange(hotel.id, { badges: parseBadges(event.target.value) })
          }
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={hotel.isAppDiscount}
            disabled={disabled}
            onChange={(event) =>
              onChange(hotel.id, { isAppDiscount: event.target.checked })
            }
          />
          앱 할인
        </label>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={hotel.taxIncluded}
            disabled={disabled}
            onChange={(event) =>
              onChange(hotel.id, { taxIncluded: event.target.checked })
            }
          />
          세금 포함
        </label>
      </div>
    </div>
  );
}

interface HotelSummaryCardProps {
  hotel: ShowcaseHotelCard;
  hotelIndex: number;
  onOpen: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

function HotelSummaryCard({
  hotel,
  hotelIndex,
  onOpen,
  onRemove,
  disabled = false,
}: HotelSummaryCardProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="group flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-400">호텔 {hotelIndex + 1}</p>
              <h4 className="truncate text-sm font-semibold text-gray-900">
                {hotel.name}
              </h4>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">{hotel.location}</p>
          <p className="mt-1 text-xs font-medium text-gray-700">
            {hotel.discountRate != null && hotel.discountRate > 0 && (
              <span className="mr-1 text-red-500">{hotel.discountRate}%</span>
            )}
            {hotel.discountPrice.toLocaleString("ko-KR")}원~
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-yellow-500">
            {"★".repeat(hotel.stars)}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="absolute right-2 top-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        삭제
      </button>
    </div>
  );
}

interface HotelEditModalProps {
  isOpen: boolean;
  cityId: string;
  hotel: ShowcaseHotelCard | null;
  hotelIndex: number;
  onClose: () => void;
  onChange: (
    cityId: string,
    hotelId: string,
    patch: Partial<ShowcaseHotelCard>,
  ) => void;
  onRemove: (hotelId: string) => void;
  disabled?: boolean;
}

function HotelEditModal({
  isOpen,
  cityId,
  hotel,
  hotelIndex,
  onClose,
  onChange,
  onRemove,
  disabled = false,
}: HotelEditModalProps) {
  return (
    <Modal
      isOpen={isOpen && hotel !== null}
      onClose={onClose}
      title="호텔 수정"
      className="max-w-4xl"
    >
      {hotel && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{cityId}</span> · 호텔{" "}
            {hotelIndex + 1}
            <span className="ml-2 text-gray-400">클릭한 호텔을 수정합니다.</span>
          </div>
          <HotelEditor
            cityId={cityId}
            hotel={hotel}
            hotelIndex={hotelIndex}
            onChange={(hotelId, patch) => onChange(cityId, hotelId, patch)}
            onRemove={(hotelId) => {
              onRemove(hotelId);
              onClose();
            }}
            disabled={disabled}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface HotelDraftEditorProps {
  draft: HotelDraftState;
  onChange: (patch: Partial<HotelDraftState>) => void;
  disabled?: boolean;
}

function HotelDraftEditor({ draft, onChange, disabled = false }: HotelDraftEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="호텔명"
          value={draft.name}
          disabled={disabled}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <Input
          label="지역"
          value={draft.location}
          disabled={disabled}
          onChange={(event) => onChange({ location: event.target.value })}
        />
        <Input
          label="이미지 URL"
          value={draft.imageUrl}
          disabled={disabled}
          onChange={(event) => onChange({ imageUrl: event.target.value })}
        />
        <Input
          label="별점"
          type="number"
          min={1}
          max={5}
          value={draft.stars}
          disabled={disabled}
          onChange={(event) => onChange({ stars: event.target.value })}
        />
        <Input
          label="원가"
          type="number"
          min={0}
          value={draft.originalPrice}
          disabled={disabled}
          onChange={(event) => onChange({ originalPrice: event.target.value })}
        />
        <Input
          label="할인가"
          type="number"
          min={0}
          value={draft.discountPrice}
          disabled={disabled}
          onChange={(event) => onChange({ discountPrice: event.target.value })}
        />
        <Input
          label="할인율"
          type="number"
          min={0}
          max={100}
          value={draft.discountRate}
          disabled={disabled}
          onChange={(event) => onChange({ discountRate: event.target.value })}
        />
        <Input
          label="뱃지"
          value={draft.badges}
          disabled={disabled}
          onChange={(event) => onChange({ badges: event.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={draft.isAppDiscount}
            disabled={disabled}
            onChange={(event) =>
              onChange({ isAppDiscount: event.target.checked })
            }
          />
          앱 할인
        </label>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={draft.taxIncluded}
            disabled={disabled}
            onChange={(event) => onChange({ taxIncluded: event.target.checked })}
          />
          세금 포함
        </label>
      </div>
    </div>
  );
}

interface HotelCreateModalProps {
  isOpen: boolean;
  cityId: string;
  cityName: string;
  draft: HotelDraftState | null;
  onClose: () => void;
  onChange: (patch: Partial<HotelDraftState>) => void;
  onConfirm: () => void;
  disabled?: boolean;
}

function HotelCreateModal({
  isOpen,
  cityId,
  cityName,
  draft,
  onClose,
  onChange,
  onConfirm,
  disabled = false,
}: HotelCreateModalProps) {
  const canConfirm = draft ? isValidHotelDraft(draft) : false;

  return (
    <Modal isOpen={isOpen && draft !== null} onClose={onClose} title="호텔 추가" className="max-w-4xl">
      {draft && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{cityName || cityId}</span>
            에 새 호텔을 추가합니다.
          </div>
          <HotelDraftEditor draft={draft} onChange={onChange} disabled={disabled} />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={disabled || !canConfirm}
              onClick={onConfirm}
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface CityCardProps {
  city: CityDraftState;
  index: number;
  totalCount: number;
  busy: boolean;
  generatingMode: GenerationMode | "save" | null;
  onScopeChange: (
    cityId: string,
    patch: Partial<Pick<CityDraftState, "cityName" | "prompt" | "startDate" | "endDate">>,
  ) => void;
  onContentChange: (
    cityId: string,
    patch: Partial<Pick<CityDraftState, "title" | "imageUrl">>,
  ) => void;
  onGenerate: (cityId: string, mode: GenerationMode) => Promise<void>;
  onOpenHotelCreate: (cityId: string) => void;
  onHotelRemove: (cityId: string, hotelId: string) => void;
  onOpenHotelEditor: (cityId: string, hotelId: string) => void;
  onClone: (cityId: string) => void;
  onRemove: (cityId: string) => void;
}

function CityCard({
  city,
  index,
  totalCount,
  busy,
  generatingMode,
  onScopeChange,
  onContentChange,
  onGenerate,
  onOpenHotelCreate,
  onHotelRemove,
  onOpenHotelEditor,
  onClone,
  onRemove,
}: CityCardProps) {
  const stale =
    hasGeneratedContent(city) &&
    (!isSectionGenerated(city, city.titleGenerationKey) ||
      !isSectionGenerated(city, city.imageGenerationKey) ||
      !isSectionGenerated(city, city.hotelsGenerationKey));
  const readyToSave = isCityReadyToSave(city);
  const showGeneratedContent = city.contentVisible;
  const isCityGenerating = busy && generatingMode !== "save";

  return (
    <Card className={stale ? "border-amber-300" : ""}>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(city)}`}
              >
                {getStatusLabel(city)}
              </span>
              <span className="text-xs text-gray-400">
                도시 {index + 1} / {totalCount}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {city.cityName || "도시명 없음"}
              </h3>
              {stale && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  다시 생성 필요
                </span>
              )}
            </div>
            <p className="max-w-3xl text-sm text-gray-500">
              {city.prompt.trim()
                ? city.prompt
                : "프롬프트를 입력하면 생성 결과가 더 구체적으로 정리됩니다."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onClone(city.id)}
              disabled={busy}
            >
              복제
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(city.id)}
              disabled={busy || totalCount === 1}
            >
              삭제
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-4">
              <Input
                label="도시명"
                value={city.cityName}
                placeholder="예: 도쿄"
                onChange={(event) =>
                  onScopeChange(city.id, { cityName: event.target.value })
                }
                disabled={busy}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  프롬프트
                </label>
                <textarea
                  value={city.prompt}
                  placeholder="예: 가을 감성, 커플 여행, 고급 호텔 중심"
                  onChange={(event) =>
                    onScopeChange(city.id, { prompt: event.target.value })
                  }
                  disabled={busy}
                  className="min-h-[110px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <DatePicker
                  label="노출 시작일"
                  value={city.startDate}
                  onChange={(value) => {
                    onScopeChange(city.id, { startDate: value });
                    if (
                      new Date(`${city.endDate}T00:00:00`) <
                      new Date(`${value}T00:00:00`)
                    ) {
                      onScopeChange(city.id, { endDate: value });
                    }
                  }}
                />
                <DatePicker
                  label="노출 종료일"
                  value={city.endDate}
                  minDate={city.startDate}
                  onChange={(value) => onScopeChange(city.id, { endDate: value })}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy || !city.cityName.trim()}
                  onClick={() => onGenerate(city.id, "all")}
                >
                  컨텐츠 생성
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {showGeneratedContent ? (
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            타이틀
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            현재 생성된 타이틀을 바로 수정할 수 있습니다.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !city.cityName.trim()}
                          onClick={() => onGenerate(city.id, "title")}
                        >
                          AI 타이틀 재생성
                        </Button>
                      </div>
                      <div className="mt-3">
                        <Input
                          label=""
                          value={city.title}
                          placeholder="타이틀이 생성됩니다"
                          onChange={(event) =>
                            onContentChange(city.id, { title: event.target.value })
                          }
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            대표 이미지
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !city.cityName.trim()}
                          onClick={() => onGenerate(city.id, "image")}
                        >
                          AI 이미지 재생성
                        </Button>
                      </div>
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="relative aspect-[16/9]">
                          {city.imageUrl ? (
                            <img
                              src={city.imageUrl}
                              alt={city.cityName || "쇼케이스 이미지"}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).style.display =
                                  "none";
                              }}
                              onLoad={(event) => {
                                (event.currentTarget as HTMLImageElement).style.display =
                                  "";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                              이미지 없음
                            </div>
                          )}
                          {isCityGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                              <span className="text-sm font-medium text-white">
                                생성 중...
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-gray-200 p-3">
                          <Input
                            label="이미지 URL"
                            value={city.imageUrl}
                            placeholder="이미지가 생성됩니다"
                            onChange={(event) =>
                              onContentChange(city.id, {
                                imageUrl: event.target.value,
                              })
                            }
                            disabled={busy}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            호텔 목록
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            카드 클릭으로 상세 수정 모달을 엽니다.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">
                            {city.hotels.length}개
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy || !city.cityName.trim()}
                            onClick={() => onGenerate(city.id, "hotels")}
                          >
                            호텔 AI 추천 재구성
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy || !city.cityName.trim()}
                            onClick={() => onOpenHotelCreate(city.id)}
                          >
                            호텔 추가
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        {city.hotels.length > 0 ? (
                          <div className="grid gap-3">
                            {city.hotels.map((hotel, hotelIndex) => (
                              <HotelSummaryCard
                                key={hotel.id}
                                hotel={hotel}
                                hotelIndex={hotelIndex}
                                onOpen={() =>
                                  onOpenHotelEditor(city.id, hotel.id)
                                }
                                onRemove={() =>
                                  onHotelRemove(city.id, hotel.id)
                                }
                                disabled={busy}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-400">
                            호텔이 아직 없습니다. AI 생성 또는 직접 추가를 사용하세요.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    생성 전 상태입니다
                  </p>
                  <p className="max-w-2xl text-sm text-gray-500">
                    도시 정보를 입력한 뒤 컨텐츠를 생성하면 오른쪽에 타이틀,
                    이미지, 호텔 목록이 카드 형태로 나타납니다.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                {showGeneratedContent
                  ? readyToSave
                    ? "지금 상태로 저장할 수 있습니다."
                    : "타이틀, 이미지, 호텔이 모두 생성되어야 저장할 수 있습니다."
                  : "아직 생성되지 않았습니다."}
                {city.errorMessage && (
                  <span className="ml-2 text-red-500">{city.errorMessage}</span>
                )}
              </div>
              <div className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
                {getScopeKey(city)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShowcaseCreationViewContent() {
  const { pushToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cities, setCities] = useState<CityDraftState[]>([
    createEmptyCityDraft(),
  ]);
  const [activeAction, setActiveAction] = useState<{
    cityId: string | "all";
    mode: GenerationMode | "save";
  } | null>(null);
  const [activeHotelEditor, setActiveHotelEditor] = useState<{
    cityId: string;
    hotelId: string;
  } | null>(null);
  const [activeHotelCreate, setActiveHotelCreate] = useState<{
    cityId: string;
    cityName: string;
    draft: HotelDraftState;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null,
  );
  const [generationProgress, setGenerationProgress] = useState({
    currentCityName: "",
    completed: 0,
    total: 0,
  });
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!generationStartedAt) {
      setElapsedMs(0);
      return;
    }

    setElapsedMs(Date.now() - generationStartedAt);
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - generationStartedAt);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generationStartedAt]);

  const updateCity = (
    cityId: string,
    updater: (city: CityDraftState) => CityDraftState,
  ) => {
    setCities((prev) => prev.map((city) => (city.id === cityId ? updater(city) : city)));
  };

  const patchScope = (
    cityId: string,
    patch: Partial<Pick<CityDraftState, "cityName" | "prompt" | "startDate" | "endDate">>,
  ) => {
    const nextStart = patch.startDate ?? undefined;
    const nextEnd = patch.endDate ?? undefined;
    const currentStart = patch.startDate ?? undefined;
    updateCity(cityId, (city) => ({
      ...city,
      ...patch,
      endDate:
        (nextStart &&
          new Date(`${city.endDate}T00:00:00`) < new Date(`${nextStart}T00:00:00`))
          ? nextStart
          : nextEnd &&
              new Date(`${nextEnd}T00:00:00`) <
                new Date(`${currentStart ?? city.startDate}T00:00:00`)
            ? currentStart ?? city.startDate
            : patch.endDate ?? city.endDate,
      status: "draft",
      contentVisible: false,
      titleGenerationKey: undefined,
      imageGenerationKey: undefined,
      hotelsGenerationKey: undefined,
      errorMessage: undefined,
    }));
  };

  const patchContent = (
    cityId: string,
    patch: Partial<Pick<CityDraftState, "title" | "imageUrl">>,
  ) => {
    updateCity(cityId, (city) => ({
      ...city,
      ...patch,
      status: city.status === "saved" ? "generated" : city.status === "error" ? "draft" : city.status,
      errorMessage: undefined,
    }));
  };

  const patchHotel = (
    cityId: string,
    hotelId: string,
    patch: Partial<ShowcaseHotelCard>,
  ) => {
    updateCity(cityId, (city) => ({
      ...city,
      hotels: city.hotels.map((hotel) =>
        hotel.id === hotelId ? { ...hotel, ...patch } : hotel,
      ),
      status: city.status === "saved" ? "generated" : city.status === "error" ? "draft" : city.status,
      errorMessage: undefined,
    }));
  };

  const openHotelCreate = (cityId: string) => {
    const city = cities.find((item) => item.id === cityId);
    setActiveHotelCreate({
      cityId,
      cityName: city?.cityName ?? "",
      draft: createEmptyHotelDraft(),
    });
  };

  const updateHotelCreateDraft = (patch: Partial<HotelDraftState>) => {
    setActiveHotelCreate((current) =>
      current ? { ...current, draft: { ...current.draft, ...patch } } : current,
    );
  };

  const confirmHotelCreate = () => {
    if (!activeHotelCreate || !isValidHotelDraft(activeHotelCreate.draft)) {
      showErrorToast("호텔 추가 실패", "입력값을 확인해 주세요.");
      return;
    }
    const newHotel = hotelDraftToCard(activeHotelCreate.draft);
    updateCity(activeHotelCreate.cityId, (city) => ({
      ...city,
      hotels: [...city.hotels, newHotel],
      status: city.status === "saved" ? "generated" : city.status === "error" ? "draft" : city.status,
      errorMessage: undefined,
    }));
    setActiveHotelCreate(null);
    showSuccessToast("호텔 추가 완료", "새 호텔이 목록에 추가되었습니다.");
  };

  const closeHotelCreate = () => {
    setActiveHotelCreate(null);
  };

  const removeHotel = (cityId: string, hotelId: string) => {
    updateCity(cityId, (city) => ({
      ...city,
      hotels: city.hotels.filter((hotel) => hotel.id !== hotelId),
      status: city.status === "saved" ? "generated" : city.status === "error" ? "draft" : city.status,
      errorMessage: undefined,
    }));
    showSuccessToast("호텔 삭제 완료", "호텔이 목록에서 제거되었습니다.");
  };

  const generateCity = async (cityId: string, mode: GenerationMode) => {
    await runCityGeneration(cityId, mode, true, true, true);
  };

  const runCityGeneration = async (
    cityId: string,
    mode: GenerationMode,
    trackBusy: boolean,
    revealContent: boolean,
    notifyToast = true,
  ): Promise<boolean> => {
    const snapshot = cities.find((city) => city.id === cityId);
    if (!snapshot) return false;
    if (!snapshot.cityName.trim()) {
      updateCity(cityId, (city) => ({
        ...city,
        status: "error",
        errorMessage: "도시명을 입력해 주세요.",
      }));
      if (notifyToast) {
        showErrorToast("생성 실패", "도시명을 입력해 주세요.");
      }
      return false;
    }

    const scopeKey = getScopeKey(snapshot);
    if (trackBusy) {
      setActiveAction({ cityId, mode });
      setGenerationStartedAt(Date.now());
      setGenerationProgress({
        currentCityName: snapshot.cityName,
        completed: 0,
        total: 1,
      });
    }
    setGlobalError(null);

    try {
      let nextTitle = snapshot.title;
      let nextImageUrl = snapshot.imageUrl;
      let nextHotels = snapshot.hotels;
      const sectionPatch: Partial<CityDraftState> = {
        errorMessage: undefined,
      };

      if (mode === "all" || mode === "title") {
        nextTitle = await generateShowcaseTitle(
          showcaseService,
          snapshot.cityName,
          snapshot.prompt || undefined,
        );
        sectionPatch.title = nextTitle;
        sectionPatch.titleGenerationKey = scopeKey;
      }

      if (mode === "all" || mode === "image") {
        if (!nextTitle.trim()) {
          nextTitle = await generateShowcaseTitle(
            showcaseService,
            snapshot.cityName,
            snapshot.prompt || undefined,
          );
          sectionPatch.title = nextTitle;
          sectionPatch.titleGenerationKey = scopeKey;
        }

        nextImageUrl = await generateShowcaseImage(
          showcaseService,
          snapshot.cityName,
          nextTitle,
          snapshot.prompt || undefined,
        );
        sectionPatch.imageUrl = nextImageUrl;
        sectionPatch.imageGenerationKey = scopeKey;
      }

      if (mode === "all" || mode === "hotels") {
        nextHotels = await generateShowcaseHotels(
          showcaseService,
          snapshot.cityName,
          nextTitle || undefined,
          snapshot.prompt || undefined,
        );
        sectionPatch.hotels = nextHotels;
        sectionPatch.hotelsGenerationKey = scopeKey;
      }

      if (mode === "all") {
        sectionPatch.titleGenerationKey = scopeKey;
        sectionPatch.imageGenerationKey = scopeKey;
        sectionPatch.hotelsGenerationKey = scopeKey;
      }

      updateCity(cityId, (city) => ({
        ...city,
        ...sectionPatch,
        title: sectionPatch.title ?? city.title,
        imageUrl: sectionPatch.imageUrl ?? city.imageUrl,
        hotels: sectionPatch.hotels ?? city.hotels,
        status: "generated",
        contentVisible: revealContent ? true : city.contentVisible,
      }));
      if (notifyToast) {
        const toast = getGenerationSuccessToast(mode);
        showSuccessToast(toast.title, toast.description);
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "생성 중 오류가 발생했습니다.";
      updateCity(cityId, (city) => ({
        ...city,
        status: "error",
        errorMessage: message,
      }));
      if (notifyToast) {
        showErrorToast("생성 실패", message);
      }
      return false;
    } finally {
      if (trackBusy) {
        setActiveAction(null);
        setGenerationStartedAt(null);
      }
    }
  };

  const generateAllCities = async () => {
    setActiveAction({ cityId: "all", mode: "all" });
    setGlobalError(null);
    setGenerationStartedAt(Date.now());
    let allSucceeded = true;
    setGenerationProgress({
      currentCityName: cities[0]?.cityName ?? "",
      completed: 0,
      total: cities.length,
    });
    setCities((prev) => prev.map((city) => ({ ...city, contentVisible: false })));

    try {
      for (const [index, city] of cities.entries()) {
        if (!city.cityName.trim()) {
          updateCity(city.id, (current) => ({
            ...current,
            status: "error",
            errorMessage: "도시명을 입력해 주세요.",
          }));
          allSucceeded = false;
          setGenerationProgress((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            currentCityName: city.cityName || `도시 ${index + 1}`,
          }));
          continue;
        }
        setGenerationProgress((prev) => ({
          ...prev,
          currentCityName: city.cityName,
        }));
        const succeeded = await runCityGeneration(city.id, "all", false, false, false);
        if (!succeeded) {
          allSucceeded = false;
        }
        setGenerationProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }
      setCities((prev) =>
        prev.map((city) =>
          city.status === "generated" || city.status === "saved"
            ? { ...city, contentVisible: true }
            : city,
        ),
      );
      if (allSucceeded) {
        showSuccessToast("일괄 컨텐츠 생성 완료", "모든 도시의 컨텐츠를 생성했습니다.");
      } else {
        showErrorToast("일괄 컨텐츠 생성 일부 실패", "일부 도시를 생성하지 못했습니다.");
      }
    } finally {
      setActiveAction(null);
      setGenerationStartedAt(null);
    }
  };

  const saveAllCities = async () => {
    const invalidCity = cities.find((city) => !isCityReadyToSave(city));
    if (invalidCity) {
      setGlobalError("모든 도시의 타이틀, 이미지, 호텔을 먼저 생성해 주세요.");
      showErrorToast("저장 실패", "모든 도시의 타이틀, 이미지, 호텔을 먼저 생성해 주세요.");
      return;
    }

    setActiveAction({ cityId: "all", mode: "save" });
    setGlobalError(null);

    try {
      for (const city of cities) {
        const payload = {
          cityName: city.cityName.trim(),
          title: city.title.trim(),
          imageUrl: city.imageUrl.trim() || DEFAULT_IMAGE_URL,
          hotels: city.hotels,
          serviceEnabled: true,
          startDate: toIsoStart(city.startDate),
          endDate: toIsoEnd(city.endDate),
        };

        const saved = city.savedShowcaseId
          ? await showcaseService.updateShowcase(city.savedShowcaseId, payload)
          : await showcaseService.createShowcase(payload);

        updateCity(city.id, (current) => ({
          ...current,
          savedShowcaseId: saved.id,
          status: "saved",
          errorMessage: undefined,
          titleGenerationKey: getScopeKey(current),
          imageGenerationKey: getScopeKey(current),
          hotelsGenerationKey: getScopeKey(current),
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ["showcase"] });
      showSuccessToast("저장 완료", "쇼케이스가 저장되었습니다.");
      router.push("/admin/content/showcase");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      setGlobalError(message);
      showErrorToast("저장 실패", message);
    } finally {
      setActiveAction(null);
      setGenerationStartedAt(null);
    }
  };

  const addCity = () => {
    setCities((prev) => [...prev, createEmptyCityDraft()]);
    showSuccessToast("도시 추가 완료", "새 도시 카드가 추가되었습니다.");
  };

  const cloneCity = (cityId: string) => {
    const source = cities.find((city) => city.id === cityId);
    if (!source) return;
    setCities((prev) => [...prev, cloneCityDraft(source)]);
    showSuccessToast("도시 복제 완료", "선택한 도시 카드가 복제되었습니다.");
  };

  const removeCity = (cityId: string) => {
    if (cities.length === 1) return;
    setCities((prev) => {
      return prev.filter((city) => city.id !== cityId);
    });
    showSuccessToast("도시 삭제 완료", "도시 카드가 제거되었습니다.");
  };

  const busy = activeAction !== null;
  const canSaveAll = cities.every(isCityReadyToSave);
  const isGeneratingAll = activeAction?.cityId === "all" && activeAction.mode === "all";
  const activeHotelEditorCity = activeHotelEditor
    ? cities.find((city) => city.id === activeHotelEditor.cityId)
    : undefined;
  const activeHotelEditorHotel = activeHotelEditorCity
    ? activeHotelEditorCity.hotels.find(
        (hotel) => hotel.id === activeHotelEditor?.hotelId,
      )
    : undefined;
  const activeHotelEditorIndex = activeHotelEditorCity && activeHotelEditorHotel
    ? activeHotelEditorCity.hotels.findIndex(
        (hotel) => hotel.id === activeHotelEditorHotel.id,
      )
    : -1;
  const statusMessage = useMemo(() => {
    if (!activeAction) return null;
    if (activeAction.mode === "save") return "저장 중...";
    if (isGeneratingAll) {
      return `일괄 컨텐츠 생성 중 • ${generationProgress.completed}/${generationProgress.total}개 • ${generationProgress.currentCityName || "대기 중"}`;
    }
    return `생성 중 • ${generationProgress.currentCityName || "대기 중"}`;
  }, [activeAction, generationProgress.completed, generationProgress.currentCityName, generationProgress.total, isGeneratingAll]);

  const showSuccessToast = (title: string, description?: string) => {
    pushToast({ title, description, variant: "success" });
  };

  const showErrorToast = (title: string, description?: string) => {
    pushToast({ title, description, variant: "error" });
  };

  const getGenerationSuccessToast = (mode: GenerationMode): { title: string; description: string } => {
    if (mode === "all") {
      return {
        title: "컨텐츠 생성 완료",
        description: "타이틀, 이미지, 호텔 목록을 모두 생성했습니다.",
      };
    }
    if (mode === "title") {
      return {
        title: "AI 타이틀 재생성 완료",
        description: "타이틀을 새로 만들었습니다.",
      };
    }
    if (mode === "image") {
      return {
        title: "AI 이미지 재생성 완료",
        description: "대표 이미지를 새로 만들었습니다.",
      };
    }
    return {
      title: "호텔 AI 추천 재구성 완료",
      description: "호텔 목록을 다시 구성했습니다.",
    };
  };

  const openHotelEditor = (cityId: string, hotelId: string) => {
    setActiveHotelEditor({ cityId, hotelId });
  };

  const closeHotelEditor = () => {
    setActiveHotelEditor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">쇼케이스 생성</h1>
            <p className="mt-1 text-sm text-gray-500">
              도시를 추가하고 프롬프트, 노출기간을 설정한 뒤 전체 컨텐츠를 생성합니다.
            </p>
          </div>
          <p className="text-xs text-amber-700">
            프롬프트나 노출기간이 바뀌면 해당 도시의 타이틀, 이미지, 호텔을 다시 생성해야 합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addCity} disabled={busy}>
            도시 추가
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={generateAllCities}
            disabled={busy || cities.some((city) => !city.cityName.trim())}
          >
            일괄 컨텐츠 생성
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={saveAllCities}
            disabled={busy || !canSaveAll}
          >
            저장
          </Button>
        </div>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {activeAction && activeAction.mode !== "save" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{statusMessage}</div>
            <div className="text-xs">
              경과 시간 {formatElapsedTime(elapsedMs)}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {cities.map((city, index) => (
          <CityCard
            key={city.id}
            city={city}
            index={index}
            totalCount={cities.length}
            busy={busy}
            generatingMode={activeAction?.mode ?? null}
            onScopeChange={patchScope}
            onContentChange={patchContent}
            onGenerate={generateCity}
            onOpenHotelCreate={openHotelCreate}
            onHotelRemove={removeHotel}
            onOpenHotelEditor={openHotelEditor}
            onClone={cloneCity}
            onRemove={removeCity}
          />
        ))}
      </div>

      <HotelEditModal
        isOpen={Boolean(activeHotelEditorCity && activeHotelEditorHotel)}
        cityId={activeHotelEditorCity?.id ?? ""}
        hotel={activeHotelEditorHotel ?? null}
        hotelIndex={activeHotelEditorIndex >= 0 ? activeHotelEditorIndex : 0}
        onClose={closeHotelEditor}
        onChange={patchHotel}
        onRemove={(hotelId) => {
          if (activeHotelEditorCity) {
            removeHotel(activeHotelEditorCity.id, hotelId);
          }
        }}
        disabled={busy}
      />

      <HotelCreateModal
        isOpen={Boolean(activeHotelCreate)}
        cityId={activeHotelCreate?.cityId ?? ""}
        cityName={activeHotelCreate?.cityName ?? ""}
        draft={activeHotelCreate?.draft ?? null}
        onClose={closeHotelCreate}
        onChange={updateHotelCreateDraft}
        onConfirm={confirmHotelCreate}
        disabled={busy}
      />
    </div>
  );
}

export function ShowcaseCreationView() {
  return (
    <ToastProvider>
      <ShowcaseCreationViewContent />
    </ToastProvider>
  );
}
