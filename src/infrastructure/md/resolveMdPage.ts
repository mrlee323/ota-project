import "server-only";
import type { MdPage } from "@/domain/md/page";
import { getHotelBases, type HotelCardBase } from "./hotelLookup";

/**
 * 블록이 그리는 데 필요한 «바깥 데이터» 를 미리 채운다.
 *
 * 왜 렌더러 안에서 안 하나 — `hotel-card-list` 가 async 서버 컴포넌트가 되면
 * 어드민 캔버스(클라이언트)에서 같은 컴포넌트를 못 쓴다.
 * 그러면 미리보기용 렌더러를 따로 만들게 되고, 그 순간 «어드민 프리뷰 = 서비스 렌더러»
 * (FR-3.4)가 깨진다.
 *
 * 그래서 **데이터 해석과 그리기를 나눈다.**
 *   공개 페이지  서버에서 이 함수를 부르고 결과를 렌더러에 넘긴다
 *   캔버스       /api/md/resolve 로 같은 함수를 부른다
 * 렌더러는 양쪽에서 «순수 컴포넌트» 하나로 남는다.
 */
export type ResolvedBlocks = Record<string, Record<string, unknown>>;

export async function resolveMdPage(page: MdPage): Promise<ResolvedBlocks> {
  const out: ResolvedBlocks = {};

  // 한 페이지에 카드 블록이 여러 개여도 호텔 조회는 한 번으로 묶는다
  const cardBlocks = page.blocks.filter((b) => b.moduleType === "hotel-card-list");
  if (cardBlocks.length === 0) return out;

  const allIds = [
    ...new Set(cardBlocks.flatMap((b) => (Array.isArray(b.values.hotelRefs) ? (b.values.hotelRefs as string[]) : []))),
  ];
  const bases = await getHotelBases(allIds);
  const byId = new Map<string, HotelCardBase>(bases.map((h) => [h.id, h]));

  for (const b of cardBlocks) {
    const ids = Array.isArray(b.values.hotelRefs) ? (b.values.hotelRefs as string[]) : [];
    // 없는 호텔은 조용히 빠진다. 페이지는 뜬다 (요구사항 §8)
    out[b.id] = { hotels: ids.map((id) => byId.get(id)).filter(Boolean) };
  }

  return out;
}
