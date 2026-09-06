import { fetchHotelList } from "@/infrastructure/hotel/api";
import type { HotelBase } from "@/domain/hotel/types";

/**
 * MD 의 호텔 조회 — **골격과 가격을 따로 준다** (design.md §6).
 *
 * 호텔 카드는 id 만 저장하므로(Q1) 렌더 시점에 채워야 하는데,
 * 두 가지가 성질이 다르다.
 *
 *   골격(이름·사진·지역·등급)  거의 안 변한다 → 서버에서 그리고 캐시된다
 *   가격·할인율               자주 변한다     → 클라이언트가 채운다
 *
 * 한 번에 다 서버에서 그리면 페이지 전체가 «가격만큼 자주» 무효화된다.
 */

export interface HotelCardBase extends HotelBase {
  thumbnailUrl: string;
}

export interface HotelPrice {
  id: string;
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
}

/** 저장된 id 순서를 유지한다 — 담당자가 정한 순서가 화면 순서다 */
function inGivenOrder<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const byId = new Map(items.map((h) => [h.id, h]));
  // 없는 호텔은 조용히 빠진다. 페이지는 뜬다 (요구사항 §8 실패 모드)
  return ids.map((id) => byId.get(id)).filter((h): h is T => Boolean(h));
}

export async function getHotelBases(ids: string[]): Promise<HotelCardBase[]> {
  const all = await fetchHotelList();
  return inGivenOrder(
    all.map(({ originalPrice: _o, discountPrice: _d, discountRate: _r, ...base }) => base),
    ids,
  );
}

export async function getHotelPrices(ids: string[]): Promise<HotelPrice[]> {
  const all = await fetchHotelList();
  return inGivenOrder(
    all.map(({ id, originalPrice, discountPrice, discountRate }) => ({
      id,
      originalPrice,
      discountPrice,
      discountRate,
    })),
    ids,
  );
}

/** LLM·MCP 가 넘긴 id 가 실재하는지 확인한다 (FR-5.5) */
export async function filterExistingHotelIds(ids: string[]): Promise<string[]> {
  const all = await fetchHotelList();
  const known = new Set(all.map((h) => h.id));
  return ids.filter((id) => known.has(id));
}

export interface HotelSearchHit {
  id: string;
  name: string;
  location: string;
  stars: number;
  rating: number;
}

/**
 * MCP·L1 용 호텔 검색.
 *
 * **여기서 나온 id 만 쓸 수 있다.** LLM 이 호텔을 지어내지 못하게 하는 원천이다 (FR-5.5).
 * 가격은 주지 않는다 — 저장하면 굳고, 화면이 조회 시점 값으로 채운다 (Q1).
 */
export async function searchHotelsForMd(opts: {
  keyword?: string;
  minStars?: number;
  limit?: number;
}): Promise<HotelSearchHit[]> {
  const all = await fetchHotelList();
  const kw = opts.keyword?.trim().toLowerCase().replace(/\s+/g, "");

  return all
    .filter((h) => (opts.minStars ? h.stars >= opts.minStars : true))
    .filter((h) =>
      kw
        ? [h.name, h.nameEn, h.location].some((f) => f.toLowerCase().replace(/\s+/g, "").includes(kw))
        : true,
    )
    .slice(0, opts.limit ?? 10)
    .map(({ id, name, location, stars, rating }) => ({ id, name, location, stars, rating }));
}
