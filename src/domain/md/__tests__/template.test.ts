import { describe, it, expect } from "vitest";
import {
  SYSTEM_TEMPLATES, templateSchema, templateBlocksFrom, orderTemplates, type Template,
} from "../template";
import { MODULE_BY_TYPE, MODULE_DEFS } from "../modules";
import { blockFromDef } from "../page";
import { hero } from "../modules/hero";
import { hotelCardList } from "../modules/hotelCardList";

const userTemplate = (id: string, name: string): Template => ({
  id, name, description: "", kind: "user", visibility: "private", ownerId: "u1",
  blocks: [{ moduleType: "hero", moduleVersion: 1 }],
});

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

describe("templateBlocksFrom — 구성만 굳힌다 (FR-9.3)", () => {
  it("글과 이미지는 저장하지 않는다", () => {
    // 지난달 「가을 오사카 특가」가 다음 달 템플릿에 따라오면 아무도 못 알아본다
    const b = blockFromDef(hero, "h");
    b.values = { ...b.values, title: "가을 오사카 특가", subtitle: "최대 30% 할인" };

    const [out] = templateBlocksFrom([b], MODULE_DEFS);
    expect(out.values?.title).toBeUndefined();
    expect(out.values?.subtitle).toBeUndefined();
    expect(out.values?.imageUrl).toBeUndefined();
    expect(out.moduleType).toBe("hero");
  });

  it("모양은 남긴다 — 담당자가 정한 구성이다", () => {
    const b = blockFromDef(hotelCardList, "c");
    const [out] = templateBlocksFrom([b], MODULE_DEFS);
    expect(out.values?.layout).toBe(hotelCardList.sample.layout);
  });

  it("반복 묶음은 그대로 간다", () => {
    const b = blockFromDef(hero, "h", { type: "hotel", id: "g1" });
    expect(templateBlocksFrom([b], MODULE_DEFS)[0].group).toEqual({ type: "hotel", id: "g1" });
  });
});

describe("orderTemplates — 즐겨찾기가 위로 (FR-9.4)", () => {
  const user = [userTemplate("u-1", "내 구성")];

  it("즐겨찾기한 것이 맨 위다", () => {
    const out = orderTemplates(SYSTEM_TEMPLATES, user, ["t3-hub"]);
    expect(out[0].template.id).toBe("t3-hub");
    expect(out[0].favorite).toBe(true);
  });

  it("즐겨찾기가 없으면 내가 만든 것이 먼저다", () => {
    const out = orderTemplates(SYSTEM_TEMPLATES, user, []);
    expect(out[0].template.id).toBe("u-1");
    expect(out.every((x) => !x.favorite)).toBe(true);
  });

  it("모르는 id 는 조용히 빠진다 — 템플릿을 지워도 목록이 안 깨진다", () => {
    const out = orderTemplates(SYSTEM_TEMPLATES, user, ["사라진-템플릿"]);
    expect(out).toHaveLength(SYSTEM_TEMPLATES.length + 1);
    expect(out.every((x) => !x.favorite)).toBe(true);
  });
});
