// import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Card, CardContent } from "@/ui/components/Card";
import { HotelSummary } from "@/domain/hotel/types";

export interface ReservationSummaryCardProps {
  /** 숙소 이름 */
  hotel: HotelSummary;
}

export const HotelSummaryCard = ({ hotel }: ReservationSummaryCardProps) => (
  <Card>
    <CardContent className="flex flex-col gap-4">
      {/* 상단: 숙소 이름 + 예약 확정 뱃지 */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 truncate">
          {hotel.name}
        </h3>
        {/* <Badge variant="success" className="shrink-0">
          예약 확정
        </Badge> */}
      </div>

      {/* 중간: 체크인/체크아웃 날짜 */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            체크인
          </span>
          <span className="font-medium text-gray-800">
            {/* {reservation.checkInDate} */}
          </span>
        </div>
        <span className="text-gray-300">→</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            체크아웃
          </span>
          <span className="font-medium text-gray-800">
            {/* {reservation.checkOut} */}
          </span>
        </div>
      </div>

      {/* 하단: 액션 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
        <Button variant="outline" size="sm" onClick={() => {}}>
          상세 보기
        </Button>
        <Button variant="primary" size="sm" onClick={() => {}}>
          결제 하기
        </Button>
      </div>
    </CardContent>
  </Card>
);
