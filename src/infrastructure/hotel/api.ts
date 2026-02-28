import { HotelMainData, HotelSummary, HotelDetail } from "@/domain/hotel/types";
import { mockHotelMainList, mockHotelList, mockHotelDetail } from "@/__mocks__/hotel";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/**
 * 메인 페이지 호텔 데이터 조회
 * TODO: 실제 API 연동 시 fetch로 교체
 */
export async function fetchHotelMain(): Promise<HotelMainData> {
  // 실제 API가 준비되면 아래 주석을 해제하고 mock 반환을 제거
  // const res = await fetch(`${API_BASE}/api/hotel/main`);
  // if (!res.ok) throw new Error("Failed to fetch hotel main data");
  // return res.json();

  // 개발용: mock 데이터를 비동기로 반환 (네트워크 지연 시뮬레이션)
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelMainList;
}

/**
 * 호텔 리스트 조회
 * TODO: 실제 API 연동 시 fetch로 교체
 */
export async function fetchHotelList(): Promise<HotelSummary[]> {
  // const res = await fetch(`${API_BASE}/api/hotel/list`);
  // if (!res.ok) throw new Error("Failed to fetch hotel list");
  // return res.json();

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelList;
}

/**
 * 호텔 상세 조회
 * TODO: 실제 API 연동 시 fetch로 교체
 */
export async function fetchHotelDetail(id: string): Promise<HotelDetail> {
  // const res = await fetch(`${API_BASE}/api/hotel/${id}`);
  // if (!res.ok) throw new Error("Failed to fetch hotel detail");
  // return res.json();

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelDetail;
}
