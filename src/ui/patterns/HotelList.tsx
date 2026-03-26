"use client";

import { useHotelList } from "@/application/hotel/useHotelList";
import { HotelListCard } from "@/ui/patterns/HotelListCard";

export const HotelList = () => {
  const { data: hotelList, isLoading } = useHotelList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        로딩 중...
      </div>
    );
  }

  if (!hotelList || hotelList.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        예약 내역이 없습니다.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {hotelList.map((hotel) => (
        <li key={hotel.id}>
          <HotelListCard hotel={hotel} />
        </li>
      ))}
    </ul>
  );
};
