import { z } from "zod";
import type { ModuleDef, ValidationIssue } from "./moduleDef";
import { validateBlock } from "./moduleDef";

// ─── 페이지 데이터 ──────────────────────────────────────────────────────────
//
// MD 는 HTML 이 아니라 JSON 으로 저장한다 (D3 · FR-2.1).
// 모듈 마크업을 고치면 이미 발행된 MD 도 같이 바뀐다 (FR-2.2 · AC-5).

/**
 * 반복 묶음 표시 (design.md §5).
 *
 * 관리 대상이 아니라 «태그» 다 — 계층은 `template → module` 2단계를 유지한다.
 * `type` 하나로는 안 된다: 호텔이 4곳이면 type="hotel" 블록이 12개 연속이라
 * 어디서 끊기는지 알 수 없다. `id` 가 경계를 준다.
 */
export const blockGroupSchema = z.object({
  /** 무엇의 묶음인가 — 버튼 라벨·복제 규칙 */
  type: z.string().min(1),
  /** 몇 번째 묶음인가 — 경계 */
  id: z.string().min(1),
});
export type BlockGroup = z.infer<typeof blockGroupSchema>;

export const mdBlockSchema = z.object({
  id: z.string().min(1),
  moduleType: z.string().min(1),
  moduleVersion: z.number().int().positive(),
  /** 검증은 validateBlock 이 모듈 정의를 보고 런타임에 한다 (D4) */
  values: z.record(z.string(), z.unknown()),
  group: blockGroupSchema.optional(),
});
export type MdBlock = z.infer<typeof mdBlockSchema>;

export const mdPageSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(mdBlockSchema),
});
export type MdPage = z.infer<typeof mdPageSchema>;

export const emptyMdPage = (): MdPage => ({ schemaVersion: 1, blocks: [] });

// ─── 순수 함수 ──────────────────────────────────────────────────────────────

export type PageIssue = ValidationIssue & { blockId: string };

/**
 * 페이지 전체를 검증한다.
 *
 * 렌더러가 모르는 타입은 «스킵» 이지만(D5), **저장할 때는 다르다** —
 * 어드민이 존재하지 않는 모듈로 저장하는 것은 막아야 한다 (FR-2.5).
 */
export function validatePage(page: MdPage, defs: ModuleDef[]): PageIssue[] {
  const byType = new Map(defs.map((d) => [d.type, d]));

  return page.blocks.flatMap((b) => {
    const def = byType.get(b.moduleType);
    if (!def) return [{ blockId: b.id, key: "moduleType", message: `모르는 모듈입니다: ${b.moduleType}` }];
    return validateBlock(def, b.values).map((i) => ({ ...i, blockId: b.id }));
  });
}

/** 모듈 정의의 sample 로 블록 하나를 만든다 (FR-1.4) */
export function blockFromDef(def: ModuleDef, id: string, group?: BlockGroup): MdBlock {
  return {
    id,
    moduleType: def.type,
    moduleVersion: def.version,
    values: { ...def.sample },
    ...(group ? { group } : {}),
  };
}
