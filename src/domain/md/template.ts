import { z } from "zod";
import { blockGroupSchema, type MdBlock } from "./page";
import { isContentField } from "./group";
import type { ModuleDef } from "./moduleDef";

// ─── 템플릿 ────────────────────────────────────────────────────────────────
//
// 계층은 `template → module` **2단계** 다. 중간 단계를 만들지 않는다.
// 반복 묶음은 별도 엔티티가 아니라 블록의 `group` 태그로 푼다 (design.md §5).

export const templateBlockSchema = z.object({
  moduleType: z.string().min(1),
  moduleVersion: z.number().int().positive().default(1),
  /** 있으면 «샘플이 채워진 채로» 캔버스에 얹힌다 (FR-9.6) */
  values: z.record(z.string(), z.unknown()).optional(),
  group: blockGroupSchema.optional(),
});
export type TemplateBlock = z.infer<typeof templateBlockSchema>;

export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  blocks: z.array(templateBlockSchema),
  kind: z.enum(["system", "user"]),
  /** v1 은 private 만 만든다. 공유는 명시적 승격이다 (Q8) */
  visibility: z.enum(["private", "shared"]).default("private"),
  ownerId: z.string().optional(),
});
export type Template = z.infer<typeof templateSchema>;

// ─── 시스템 템플릿 4종 ─────────────────────────────────────────────────────
//
// 실사 표본 7건을 100% 커버한 조합이다 (docs/md/module-survey.md §4).
// **여기가 원본이다.** 한때 DB 시드와 두 벌로 뒀는데 설명 문구가 갈렸다.
// DB(md_templates)에는 사용자가 저장한 것만 들어온다.

const hotelGroup = (n: number): TemplateBlock[] => {
  const group = { type: "hotel", id: `g${n}` };
  return [
    { moduleType: "image", moduleVersion: 1, group },
    { moduleType: "image", moduleVersion: 1, group },
    { moduleType: "cta", moduleVersion: 1, group },
  ];
};

export const SYSTEM_TEMPLATES: Template[] = [
  {
    id: "t1-brand",
    name: "브랜드·다호텔",
    description:
      "호텔 여러 곳을 하나씩 소개한다. 브랜드 위크·체인 프로모션에 쓴다. " +
      "호텔 한 곳이 «구간» 하나이고, 캔버스에서 구간을 통째로 추가할 수 있다.",
    kind: "system",
    visibility: "private",
    blocks: [
      { moduleType: "hero", moduleVersion: 1 },
      ...hotelGroup(1),
      { moduleType: "notes", moduleVersion: 1 },
    ],
  },
  {
    id: "t2-theme",
    name: "목적지 테마",
    description:
      "한 지역·테마를 소개하고 관련 숙소로 보낸다. 시즌 기획전에 쓴다.",
    kind: "system",
    visibility: "private",
    blocks: [
      { moduleType: "hero", moduleVersion: 1 },
      { moduleType: "image", moduleVersion: 1 },
      { moduleType: "section-title", moduleVersion: 1 },
      { moduleType: "hotel-card-list", moduleVersion: 1 },
      { moduleType: "cta", moduleVersion: 1 },
      { moduleType: "notes", moduleVersion: 1 },
    ],
  },
  {
    id: "t3-hub",
    name: "허브·특가",
    description:
      "구간마다 숙소 목록을 늘어놓는다. 디자이너 이미지 없이 만들 수 있는 유일한 템플릿이고, " +
      "가격이 저절로 최신이 되므로 상시 운영에 가장 적합하다.",
    kind: "system",
    visibility: "private",
    blocks: [
      { moduleType: "hero", moduleVersion: 1 },
      { moduleType: "section-title", moduleVersion: 1 },
      { moduleType: "hotel-card-list", moduleVersion: 1 },
      { moduleType: "notes", moduleVersion: 1 },
    ],
  },
  {
    id: "t4-single",
    name: "단독·제휴",
    description: "한 건만 알린다. 제휴 이벤트·단독 특가처럼 내용이 짧을 때 쓴다.",
    kind: "system",
    visibility: "private",
    blocks: [
      { moduleType: "hero", moduleVersion: 1 },
      { moduleType: "image", moduleVersion: 1 },
      { moduleType: "cta", moduleVersion: 1 },
      { moduleType: "notes", moduleVersion: 1 },
    ],
  },
];

// ─── 사용자 템플릿 ─────────────────────────────────────────────────────────

/**
 * 지금 캔버스 구성을 템플릿으로 굳힌다 (FR-9.3).
 *
 * **내용은 버리고 구성과 «모양» 만 남긴다.** 이유가 있다 —
 * 담당자가 「가을 오사카 특가」를 만든 뒤 그 구성을 저장하면, 다음 달에 그 템플릿을
 * 얹는 순간 지난달 문구가 그대로 따라온다. 모듈 샘플이 실물이 되던 사고와 같은 모양인데,
 * 실제로 썼던 문구라 더 그럴싸해서 아무도 못 알아본다.
 *
 * 모양(preset·fixed — 카드 배치, 안내 제목 같은 것)은 남긴다. 그게 담당자가 정한 구성이다.
 * 판별은 반복 묶음·MCP 초안이 쓰는 `isContentField` 와 같은 정의를 쓴다.
 */
export function templateBlocksFrom(blocks: MdBlock[], defs: ModuleDef[]): TemplateBlock[] {
  const byType = new Map(defs.map((d) => [d.type, d]));

  return blocks.map((b) => {
    const def = byType.get(b.moduleType);
    const values: Record<string, unknown> = {};

    for (const f of def?.fields ?? []) {
      if (isContentField(f)) continue;
      const v = b.values[f.key];
      if (v !== undefined && v !== null && v !== "") values[f.key] = v;
    }

    return {
      moduleType: b.moduleType,
      moduleVersion: b.moduleVersion,
      ...(Object.keys(values).length > 0 ? { values } : {}),
      ...(b.group ? { group: b.group } : {}),
    };
  });
}

/**
 * 고를 목록을 만든다 — 즐겨찾기가 위로 온다 (FR-9.4).
 *
 * 즐겨찾기는 «내 목록에서 위로 올리는 행위» 지 자산이 아니다 (Q8). 그래서 개인 전용이고
 * 목록을 새로 만들지 않고 순서만 바꾼다. 모르는 id 는 조용히 빠진다 —
 * 템플릿을 지워도 즐겨찾기 행이 남을 수 있는데, 그걸로 목록이 깨지면 안 된다.
 */
export function orderTemplates(
  system: Template[],
  user: Template[],
  favoriteIds: string[],
): { template: Template; favorite: boolean }[] {
  const fav = new Set(favoriteIds);
  // 내가 만든 것이 먼저다. 시스템 4종은 언제나 있으니 아래로 밀린다
  const all = [...user, ...system].map((template) => ({ template, favorite: fav.has(template.id) }));
  return [...all.filter((x) => x.favorite), ...all.filter((x) => !x.favorite)];
}
