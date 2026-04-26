"use client";

import type { ShowcaseHotelCard } from "@/domain/hotel/showcaseTypes";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";

interface HotelSelectStepProps {
  hotels: ShowcaseHotelCard[];
  selectedHotelIds: string[];
  onToggleHotel: (hotelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirm: () => void;
  onBack?: () => void;
}

/** 호텔 선택 스텝 - 개별/전체 선택·해제 */
export function HotelSelectStep({
  hotels,
  selectedHotelIds,
  onToggleHotel,
  onSelectAll,
  onDeselectAll,
  onConfirm,
  onBack,
}: HotelSelectStepProps) {
  const allSelected = hotels.length > 0 && selectedHotelIds.length === hotels.length;
  const noneSelected = selectedHotelIds.length === 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">호텔을 선택하세요</h2>
        <p className="mt-1 text-sm text-gray-500">
          {selectedHotelIds.length}/{hotels.length}개 선택됨
        </p>
      </div>

      {/* 전체 선택/해제 버튼 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll} disabled={allSelected}>
          전체 선택
        </Button>
        <Button variant="outline" size="sm" onClick={onDeselectAll} disabled={noneSelected}>
          전체 해제
        </Button>
      </div>

      {/* 호텔 카드 그리드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => {
          const isSelected = selectedHotelIds.includes(hotel.id);
          return (
            <button
              key={hotel.id}
              type="button"
              onClick={() => onToggleHotel(hotel.id)}
              className="text-left"
            >
              <Card
                className={`transition-all ${
                  isSelected
                    ? "border-brand ring-1 ring-brand"
                    : "opacity-60 hover:opacity-80"
                }`}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{hotel.name}</h3>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 text-brand"
                    />
                  </div>
                  <p className="text-xs text-gray-500">{hotel.location}</p>
                  <div className="flex items-end gap-2">
                    {hotel.discountRate != null && hotel.discountRate > 0 && (
                      <span className="text-xs text-red-500">{hotel.discountRate}%</span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                      {hotel.discountPrice.toLocaleString("ko-KR")}원~
                    </span>
                  </div>
                  <span className="text-xs text-yellow-500">{"★".repeat(hotel.stars)}</span>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* 확인 버튼 */}
      <div className="flex justify-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            이전
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={noneSelected}
        >
          확인 ({selectedHotelIds.length}개 선택)
        </Button>
      </div>
    </div>
  );
}
