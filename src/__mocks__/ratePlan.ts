import type { RatePlan, CelebRatePlan } from "@/domain/hotel/ratePlan";

// ─── 일반 요금제 mock 데이터 ────────────────────────────────────────────────

export const mockRatePlans: RatePlan[] = [
  {
    id: "rp-1",
    roomTypeName: "디럭스 더블",
    pricePerNight: 280000,
    maxOccupancy: 2,
    includedServices: ["조식 포함", "무료 와이파이", "피트니스 센터"],
    cancellationPolicy: "체크인 3일 전까지 무료 취소",
  },
  {
    id: "rp-2",
    roomTypeName: "프리미엄 트윈",
    pricePerNight: 350000,
    maxOccupancy: 3,
    includedServices: ["조식 포함", "무료 와이파이", "수영장", "사우나"],
    cancellationPolicy: "체크인 7일 전까지 무료 취소",
  },
  {
    id: "rp-3",
    roomTypeName: "스위트 킹",
    pricePerNight: 550000,
    maxOccupancy: 4,
    includedServices: ["조식 포함", "무료 와이파이", "수영장", "라운지 이용", "미니바"],
    cancellationPolicy: "체크인 14일 전까지 무료 취소",
  },
  {
    id: "rp-4",
    roomTypeName: "스탠다드 싱글",
    pricePerNight: 180000,
    maxOccupancy: 1,
    includedServices: ["무료 와이파이"],
    cancellationPolicy: "체크인 1일 전까지 무료 취소",
  },
];

// ─── 셀럽 전용 요금제 mock 데이터 ───────────────────────────────────────────

export const mockCelebRatePlans: CelebRatePlan[] = [
  {
    id: "crp-1",
    roomTypeName: "디럭스 더블 (셀럽 특가)",
    pricePerNight: 280000,
    maxOccupancy: 2,
    includedServices: ["조식 포함", "무료 와이파이", "피트니스 센터", "레이트 체크아웃"],
    cancellationPolicy: "체크인 3일 전까지 무료 취소",
    celebId: "celeb-1",
    discountRate: 35,
    discountedPrice: Math.round(280000 * (1 - 35 / 100)),
  },
  {
    id: "crp-2",
    roomTypeName: "프리미엄 트윈 (셀럽 특가)",
    pricePerNight: 350000,
    maxOccupancy: 3,
    includedServices: ["조식 포함", "무료 와이파이", "수영장", "사우나", "웰컴 드링크"],
    cancellationPolicy: "체크인 7일 전까지 무료 취소",
    celebId: "celeb-2",
    discountRate: 25,
    discountedPrice: Math.round(350000 * (1 - 25 / 100)),
  },
];
