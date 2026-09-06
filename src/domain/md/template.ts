import { z } from "zod";
import { blockGroupSchema } from "./page";

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
// DB 에 시드로 들어가고, 여기 상수는 «시드의 원본» 이다.

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
