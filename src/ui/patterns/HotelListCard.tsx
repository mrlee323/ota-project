import { HotelSummary } from '@/domain/hotel/types';
import { Card } from '@/ui/components/Card';
import { Button } from '@/ui/components/Button';
import { cn } from '@/lib/utils/tw';

interface HotelListCardProps {
  hotel: HotelSummary;
  onClick?: (id: string) => void;
}

export const HotelListCard = ({ hotel, onClick }: HotelListCardProps) => {
  // 금액 포맷팅 함수 (3자리마다 콤마)
  const formatPrice = (price: number) => price.toLocaleString() + '원';

  return (
    <Card 
      className="group overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(hotel.id)}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* 좌측: 호텔 이미지 영역 */}
        <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden">
          <img 
            src={hotel.thumbnailUrl} 
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-white/80 backdrop-blur-sm">
            {hotel.type}
          </span>
        </div>

        {/* 우측: 호텔 정보 영역 */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-500">{hotel.location}</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs font-bold">{hotel.rating}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">{hotel.name}</h3>
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-tighter">{hotel.nameEn}</p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-blue-600 font-semibold">{hotel.stars}성급</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-600">무료취소 가능</span>
          </div>

          {/* 가격 영역 (하단 고정) */}
          <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(hotel.originalPrice)}
                </span>
                <span className="text-sm font-bold text-red-500">
                  {hotel.discountRate}%
                </span>
              </div>
              <div className="text-xl font-extrabold text-gray-900">
                {formatPrice(hotel.discountPrice)}
              </div>
            </div>
            <Button variant="primary" size="sm" className="hidden md:flex">
              상세보기
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};