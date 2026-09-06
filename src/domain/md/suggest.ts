import type { ModuleDef } from "./moduleDef";
import type { Template } from "./template";
import { searchModules } from "./search";

// ─── 템플릿 추천 ────────────────────────────────────────────────────────────
//
// MCP 를 붙이는 1번 이유는 «선택» 이다 (mcp.md §1).
// 담당자는 홍보할 상품은 알지만 «어떤 구성이 맞는지» 는 모른다 —
// 그건 디자이너가 하던 판단이고, 빼기만 하고 대신할 게 없으면 결과물이 나빠진다.
//
// 여기서 «정답» 을 내지 않는다. 후보와 **고른 이유**를 준다.
// 이유가 없으면 호출자(LLM)가 판단을 못 하고, 담당자도 납득할 수 없다.

export interface TemplateSuggestion {
  id: string;
  name: string;
  description: string;
  blocks: string[];
  /** 왜 이걸 추천하나 — 사람이 읽고 납득할 수 있어야 한다 */
  why: string;
  score: number;
}

/** 각 템플릿이 «어떤 상황» 인지. 의도 문장과 맞춰본다 */
const SIGNALS: Record<string, { keywords: string[]; why: string }> = {
  "t1-brand": {
    keywords: ["브랜드", "체인", "계열", "위크", "여러곳", "각각", "하나씩", "호텔들", "지점"],
    why: "호텔을 하나씩 소개하는 흐름이라 구간을 반복해 늘릴 수 있습니다.",
  },
  "t2-theme": {
    keywords: ["테마", "시즌", "가을", "봄", "여름", "겨울", "여행", "지역", "도시", "목적지", "축제"],
    why: "테마를 먼저 보여주고 관련 숙소로 보내는 구성입니다.",
  },
  "t3-hub": {
    keywords: ["특가", "모음", "허브", "랭킹", "추천", "주간", "상시", "리스트", "목록", "할인"],
    why: "숙소 목록이 중심이라 이미지 없이 만들 수 있고, 가격이 저절로 최신이 됩니다.",
  },
  "t4-single": {
    keywords: ["단독", "제휴", "이벤트", "쿠폰", "한정", "오픈", "기념", "단일", "하나"],
    why: "알릴 내용이 한 건이라 짧게 끝나는 구성입니다.",
  },
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/**
 * 의도 문장으로 템플릿을 고른다.
 *
 * 호텔 개수도 신호다 — 여러 곳이면 목록형, 한 곳이면 단독형에 가깝다.
 */
export function suggestTemplates(
  intent: string,
  templates: Template[],
  opts?: { hotelCount?: number },
): TemplateSuggestion[] {
  const text = norm(intent);
  const n = opts?.hotelCount;

  return templates
    .map((t) => {
      const sig = SIGNALS[t.id];
      let score = 1; // 모든 템플릿은 후보로 남는다 — 억지로 걸러내지 않는다
      const reasons: string[] = [];

      if (sig) {
        const hits = sig.keywords.filter((k) => text.includes(norm(k)));
        if (hits.length > 0) {
          score += hits.length * 3;
          reasons.push(`「${hits.slice(0, 3).join("·")}」에 맞습니다`);
        }
      }

      if (n !== undefined) {
        if (n >= 4 && (t.id === "t1-brand" || t.id === "t3-hub")) {
          score += 2;
          reasons.push(`호텔이 ${n}곳이라 여러 곳을 늘어놓는 구성이 맞습니다`);
        }
        if (n <= 1 && t.id === "t4-single") {
          score += 2;
          reasons.push("알릴 대상이 하나입니다");
        }
      }

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        blocks: t.blocks.map((b) => b.moduleType),
        why: reasons.length ? reasons.join(" · ") : (sig?.why ?? t.description),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** 의도에 맞는 모듈도 함께 제안한다 — 템플릿을 안 쓰고 조립할 때 */
export function suggestModules(intent: string, defs: ModuleDef[], limit = 5) {
  return searchModules(defs, intent).slice(0, limit);
}
