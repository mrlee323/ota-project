import type { ModuleDef } from "./moduleDef";

// ─── 모듈 검색 ──────────────────────────────────────────────────────────────
//
// 왜 «목록» 이 아니라 «검색» 인가 (docs/md/mcp.md §1 P1).
//
// 모듈 정의 하나가 300~600 토큰이다. 100개면 매 대화마다 30~60K 토큰이 나간다.
// 그래서 2단계로 나눈다 — 목록은 요약만, 전체 정의는 고른 것만.
//
// 담당자 쪽 문제도 같다: 팔레트 스크롤은 20개쯤에서 무너지고,
// 그러면 아는 3~4개만 반복해서 쓰게 되어 모듈을 100개 만든 의미가 사라진다.

/** 검색 결과 — 전체 정의가 아니라 «고를 수 있을 만큼» 만 */
export interface ModuleSummary {
  type: string;
  name: string;
  category: string;
  description: string;
  whenToUse: string;
}

export function toSummary(d: ModuleDef): ModuleSummary {
  return {
    type: d.type,
    name: d.name,
    category: d.category,
    description: d.description,
    whenToUse: d.whenToUse,
  };
}

/** 한글은 형태소가 아니라 부분 문자열로 맞춘다 — 「호텔카드」·「호텔 카드」 둘 다 걸려야 한다 */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

function score(d: ModuleDef, terms: string[]): number {
  if (terms.length === 0) return 1;

  const fields: [string, number][] = [
    [d.name, 6],
    [d.type, 5],
    // whenToUse 가 description 보다 무겁다 — «언제 쓰나» 가 고르는 근거다 (FR-1.8)
    [d.whenToUse, 3],
    [d.description, 2],
    [d.category, 1],
  ];

  let total = 0;
  for (const t of terms) {
    for (const [text, weight] of fields) {
      if (norm(text).includes(t)) total += weight;
    }
  }
  return total;
}

export function searchModules(
  defs: ModuleDef[],
  query?: string,
  category?: string,
): ModuleSummary[] {
  const terms = norm(query ?? "").length > 0
    ? (query ?? "").toLowerCase().split(/\s+/).map(norm).filter(Boolean)
    : [];

  return defs
    .filter((d) => !category || d.category === category)
    .map((d) => ({ d, s: score(d, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.d.type.localeCompare(b.d.type))
    .map((x) => toSummary(x.d));
}
