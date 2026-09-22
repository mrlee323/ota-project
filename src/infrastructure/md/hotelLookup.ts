import { fetchHotelList } from "@/infrastructure/hotel/api";
import type { HotelBase, HotelSummary } from "@/domain/hotel/types";

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

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

const matchesKeyword = (h: HotelSummary, kw: string) =>
  [h.name, h.nameEn, h.location].some((f) => normalize(f).includes(kw));

const matchesStars = (h: HotelSummary, minStars: number) => h.stars >= minStars;

const toHit = ({ id, name, location, stars, rating }: HotelSummary): HotelSearchHit => ({
  id,
  name,
  location,
  stars,
  rating,
});

function applyFilters(all: HotelSummary[], kw: string | undefined, minStars: number | undefined) {
  return all
    .filter((h) => (minStars ? matchesStars(h, minStars) : true))
    .filter((h) => (kw ? matchesKeyword(h, kw) : true));
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
  const kw = opts.keyword ? normalize(opts.keyword) : undefined;

  return applyFilters(all, kw, opts.minStars)
    .slice(0, opts.limit ?? 10)
    .map(toHit);
}

// ─── 0건 응답 ───────────────────────────────────────────────────────────────

export interface HotelSearchEmpty {
  matched: 0;
  query: { keyword?: string; minStars?: number };
  /** 어느 조건이 0건을 만들었나. 조건을 하나씩 떼어 보고 판정한다 */
  emptyBecause: "keyword" | "minStars" | "combination" | "no_data";
  /** 조건을 하나 떼면 몇 건이 되는지 — 무엇을 포기하면 되는지가 바로 보인다 */
  relaxed: Array<{ drop: "keyword" | "minStars"; matched: number }>;
  /** 아래 분포가 어떤 범위에서 센 것인지 */
  scope: string;
  available: {
    total: number;
    /** 광역(시·도) 단위로 묶는다 — keyword 에 그대로 넣을 수 있는 단어다 */
    regions: Array<{ region: string; count: number; stars: number[] }>;
    /** 등급별 호텔 수. key 는 stars, 값은 «그 등급인» 호텔 수 */
    stars: Record<string, number>;
  };
  hint: string;
}

function distribution(pool: HotelSummary[]): HotelSearchEmpty["available"] {
  const regions = new Map<string, { count: number; stars: Set<number> }>();
  const stars: Record<string, number> = {};

  for (const h of pool) {
    // "서울 광진구" → "서울". 구 단위까지 주면 목록만 길어지고 AI 가 keyword 로 고를 단어가 아니다
    const key = h.location.split(" ")[0];
    const r = regions.get(key) ?? { count: 0, stars: new Set<number>() };
    r.count += 1;
    r.stars.add(h.stars);
    regions.set(key, r);

    stars[h.stars] = (stars[h.stars] ?? 0) + 1;
  }

  return {
    total: pool.length,
    regions: [...regions]
      .map(([region, r]) => ({ region, count: r.count, stars: [...r.stars].sort((a, b) => a - b) }))
      .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region)),
    stars,
  };
}

/**
 * 0건일 때 **다음 수**를 만들어 준다 (plan.md Q-M6).
 *
 * 「호텔이 없습니다」 만 돌려주면 호출한 AI 가 단서가 없어서 조건 없이 전체 조회를
 * 한 번 더 한다 — 파일럿에서 왕복 6번 중 1번이 이거였다. 그래서 0건 응답에
 * «왜 0건인지» 와 «대신 쓸 수 있는 조건» 을 함께 싣는다.
 */
export async function explainEmptyHotelSearch(opts: {
  keyword?: string;
  minStars?: number;
}): Promise<HotelSearchEmpty> {
  const all = await fetchHotelList();
  const kw = opts.keyword ? normalize(opts.keyword) : undefined;

  // 조건을 하나만 남겨 본다. 남긴 쪽이 0건이면 그 조건이 범인이고,
  // 둘 다 살아있는데 합쳐서 0건이면 조합 탓이다
  const min = opts.minStars;
  const keywordOnly = kw ? all.filter((h) => matchesKeyword(h, kw)) : all;
  const starsOnly = min ? all.filter((h) => matchesStars(h, min)) : all;

  const relaxed: HotelSearchEmpty["relaxed"] = [];
  if (kw) relaxed.push({ drop: "keyword", matched: starsOnly.length });
  if (opts.minStars) relaxed.push({ drop: "minStars", matched: keywordOnly.length });

  const emptyBecause: HotelSearchEmpty["emptyBecause"] =
    all.length === 0
      ? "no_data"
      : kw && keywordOnly.length === 0
        ? "keyword"
        : opts.minStars && starsOnly.length === 0
          ? "minStars"
          : "combination";

  // 살아남은 쪽의 분포를 보여준다 — 그게 다음에 고를 수 있는 조건이다
  const pool =
    emptyBecause === "keyword" ? starsOnly : keywordOnly.length > 0 ? keywordOnly : starsOnly;
  const scope =
    pool === keywordOnly && kw
      ? `keyword=「${opts.keyword}」 만 적용`
      : pool === starsOnly && opts.minStars
        ? `minStars=${opts.minStars} 만 적용`
        : "전체";

  const hint =
    emptyBecause === "no_data"
      ? "호텔 데이터가 비어 있다. 조건을 바꿔도 결과가 없다."
      : emptyBecause === "keyword"
        ? `keyword 「${opts.keyword}」 에 해당하는 호텔이 없다. available.regions 의 region 값을 keyword 로 써서 다시 부른다.`
        : emptyBecause === "minStars"
          ? `minStars=${opts.minStars} 를 만족하는 호텔이 없다. available.stars 의 등급 중 하나로 낮춰 다시 부른다.`
          : `두 조건을 같이 쓰면 0건이다. ${scope} 기준 분포가 available 이니 거기서 한 조건만 골라 다시 부른다.`;

  return {
    matched: 0,
    query: { keyword: opts.keyword, minStars: opts.minStars },
    emptyBecause,
    relaxed,
    scope,
    available: distribution(pool),
    hint,
  };
}
