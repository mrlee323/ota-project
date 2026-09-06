import { describe, it, expect } from "vitest";
import { SYSTEM_TEMPLATES, templateSchema } from "../template";
import { MODULE_BY_TYPE } from "../modules";

describe("시스템 템플릿", () => {
  it("4종이고 전부 스키마를 만족한다", () => {
    expect(SYSTEM_TEMPLATES).toHaveLength(4);
    for (const t of SYSTEM_TEMPLATES) expect(() => templateSchema.parse(t)).not.toThrow();
  });

  it("템플릿이 참조하는 모듈이 전부 실재한다", () => {
    // 없는 모듈을 가리키면 캔버스가 빈 블록을 만든다
    for (const t of SYSTEM_TEMPLATES) {
      for (const b of t.blocks) {
        expect(MODULE_BY_TYPE.has(b.moduleType), `${t.id}: ${b.moduleType}`).toBe(true);
      }
    }
  });

  it("모든 템플릿이 hero 로 시작하고 notes 로 끝난다", () => {
    // 실사 F2 — 표본 6/6 에 상단 비주얼과 유의사항이 있었다
    for (const t of SYSTEM_TEMPLATES) {
      expect(t.blocks[0].moduleType).toBe("hero");
      expect(t.blocks.at(-1)?.moduleType).toBe("notes");
    }
  });

  it("허브·특가 템플릿은 이미지 블록이 없다", () => {
    // AC-3(이미지 0장 발행)이 가능한 근거다
    const hub = SYSTEM_TEMPLATES.find((t) => t.id === "t3-hub")!;
    expect(hub.blocks.some((b) => b.moduleType === "image")).toBe(false);
  });

  it("브랜드 템플릿의 반복 묶음은 group 이 같은 «연속» 블록이다", () => {
    const brand = SYSTEM_TEMPLATES.find((t) => t.id === "t1-brand")!;
    const grouped = brand.blocks.filter((b) => b.group);
    expect(grouped).toHaveLength(3);
    expect(new Set(grouped.map((b) => b.group!.id)).size).toBe(1);

    // 연속이어야 한다 — 흩어지면 묶음 경계를 못 찾는다
    const idx = brand.blocks.map((b, i) => (b.group ? i : -1)).filter((i) => i >= 0);
    expect(idx).toEqual([idx[0], idx[0] + 1, idx[0] + 2]);
  });
});
