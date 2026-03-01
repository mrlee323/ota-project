import { HotelMainData, HotelSummary, HotelDetail } from "@/domain/hotel/types";
import { mockHotelMainList, mockHotelList, mockHotelDetail } from "@/__mocks__/hotel";
// import { httpClient } from "@/infrastructure/http/client";

/**
 * 메인 페이지 호텔 데이터 조회
 * TODO: 실제 API 연동 시 httpClient로 교체 — UTM 헤더는 자동 주입됨
 */
export async function fetchHotelMain(): Promise<HotelMainData> {
  // return httpClient<HotelMainData>("/api/hotel/main");

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelMainList;
}

/**
 * 호텔 리스트 조회
 * TODO: 실제 API 연동 시 httpClient로 교체
 */
export async function fetchHotelList(): Promise<HotelSummary[]> {
  // return httpClient<HotelSummary[]>("/api/hotel/list");

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelList;
}

/**
 * 호텔 상세 조회
 * TODO: 실제 API 연동 시 httpClient로 교체
 */
export async function fetchHotelDetail(id: string): Promise<HotelDetail> {
  // return httpClient<HotelDetail>(`/api/hotel/${id}`);

  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockHotelDetail;
}
