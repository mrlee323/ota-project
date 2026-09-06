import type { MdPage, MdBlock } from "./page";
import type { ModuleDef } from "./moduleDef";

// ─── 이미지 생성 문맥 ───────────────────────────────────────────────────────
//
// 일반적인 이미지 생성이 산만한 이유는 **제약이 없어서**다.
// MD 에는 제약이 이미 있다 — 슬롯·토큰·인접 블록의 값 (llm.md §4).
//
// 핵심은 사용자가 프롬프트를 잘 쓰게 만드는 게 아니라 **서버가 문맥을 붙이는 것**이다.
// 담당자는 「AI로 만들기」만 누르면 된다.

export interface ImageContext {
  /** 이 페이지가 무엇에 관한 것인가 */
  pageTitle: string;
  /** 앞뒤 블록에서 읽어낸 문구 — 이 이미지가 놓일 «자리의 맥락» */
  nearbyText: string[];
  /** 페이지가 쓰는 색 — 자유 입력 배경색들 */
  colors: string[];
  /** 이미지가 놓이는 위치 */
  slot: "hero" | "body";
}

/** 블록에서 사람이 읽는 문구만 뽑는다 */
function textOf(block: MdBlock, def: ModuleDef | undefined): string[] {
  if (!def) return [];
  const out: string[] = [];
  for (const f of def.fields) {
    if (f.input !== "text" && f.input !== "textarea") continue;
    const v = block.values[f.key];
    if (typeof v === "string" && v.trim()) out.push(v.trim());
    else if (Array.isArray(v)) out.push(...v.filter((x): x is string => typeof x === "string"));
  }
  return out;
}

/**
 * 블록 하나가 놓인 자리의 문맥을 모은다.
 *
 * 앞뒤 2블록까지 본다 — 더 멀리 가면 다른 구간의 이야기가 섞인다.
 */
export function collectImageContext(
  page: MdPage,
  blockId: string,
  defs: ModuleDef[],
  pageTitle: string,
): ImageContext | null {
  const byType = new Map(defs.map((d) => [d.type, d]));
  const i = page.blocks.findIndex((b) => b.id === blockId);
  if (i < 0) return null;

  const near = page.blocks.slice(Math.max(0, i - 2), i + 3).filter((b) => b.id !== blockId);
  const nearbyText = near.flatMap((b) => textOf(b, byType.get(b.moduleType)));

  // 같은 묶음 안이면 그 묶음 문구를 앞세운다 — 「이 호텔」 이야기가 우선이다
  const group = page.blocks[i].group?.id;
  if (group) {
    const inGroup = page.blocks
      .filter((b) => b.group?.id === group && b.id !== blockId)
      .flatMap((b) => textOf(b, byType.get(b.moduleType)));
    nearbyText.unshift(...inGroup);
  }

  const colors = page.blocks
    .map((b) => b.values.sectionBgColor)
    .filter((c): c is string => typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c));

  return {
    pageTitle,
    nearbyText: [...new Set(nearbyText)].slice(0, 6),
    colors: [...new Set(colors)].slice(0, 3),
    slot: page.blocks[i].moduleType === "hero" ? "hero" : "body",
  };
}

/**
 * 못 미룰 제약 (llm.md §4).
 *
 * 실사 F1 의 결론이 «텍스트가 이미지 안에 갇혀 있다» 였다.
 * AI 이미지 생성이 글자 든 이미지를 만들면 **이 프로젝트가 고치려던 문제를
 * 그대로 재생산한다.** 이 네 줄은 프롬프트에서 빠질 수 없다.
 */
export const IMAGE_CONSTRAINTS = [
  "absolutely no text, no letters, no numbers, no logos, no watermarks, no UI elements",
  "no people, no faces, no humans",
  "do not depict a specific real hotel building or branded property",
  "atmosphere and texture only — background imagery, not an infographic",
];

export function buildImagePromptBrief(ctx: ImageContext, intent?: string): string {
  return [
    `Campaign: ${ctx.pageTitle}`,
    ctx.nearbyText.length ? `Nearby copy: ${ctx.nearbyText.join(" / ")}` : null,
    ctx.colors.length ? `Page accent colors: ${ctx.colors.join(", ")}` : null,
    `Placement: ${ctx.slot === "hero" ? "full-width hero banner above the fold" : "in-body section image"}`,
    intent ? `Requested mood: ${intent}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
