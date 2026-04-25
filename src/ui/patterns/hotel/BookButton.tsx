"use client";

import { useRouter } from "next/navigation";

interface BookButtonProps {
  /** 객실 요금제 ID */
  roomId: string;
  /** 객실 타입명 */
  roomName: string;
  /** 예약 가격 (셀럽 할인 적용 시 discountedPrice) */
  price: number;
  /** 호텔명 — 예약 확인 페이지에 전달 */
  hotelName: string;
}

/** 예약하기 버튼 — 클릭 시 예약 확인 페이지로 이동 */
export function BookButton({ roomId, roomName, price, hotelName }: BookButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // 검색 파라미터(날짜, 인원)는 영속화 저장소에 저장되어 있으므로 쿼리 파라미터에서 제외
    const params = new URLSearchParams({
      roomId,
      roomName,
      price: String(price),
      hotelName,
    });
    router.push(`/booking/confirm?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-3 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
    >
      예약하기
    </button>
  );
}
