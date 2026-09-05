import { describe, it, expect } from "vitest";
import { mdPageSchema, validatePage, blockFromDef, emptyMdPage } from "../page";
import { MODULE_DEFS } from "../modules";
import { hero } from "../modules/hero";

describe("MdPage 스키마", () => {
  it("빈 페이지가 유효하다", () => {
    expect(() => mdPageSchema.parse(emptyMdPage())).not.toThrow();
  });

  it("group 은 선택이고, 있으면 type 과 id 를 함께 요구한다", () => {
    // type 하나로는 묶음 «경계» 를 알 수 없다 — 같은 type 이 연속 12개일 수 있다
    const base = blockFromDef(hero, "b1");
    expect(() => mdPageSchema.parse({ schemaVersion: 1, blocks: [base] })).not.toThrow();
    expect(() =>
      mdPageSchema.parse({
        schemaVersion: 1,
        blocks: [{ ...base, group: { type: "hotel" } }],
      }),
    ).toThrow();
  });
});

describe("validatePage", () => {
  it("모르는 모듈 타입은 저장 단계에서 «막는다»", () => {
    // 렌더는 스킵하지만(D5), 저장은 막아야 한다 (FR-2.5).
    // 어드민이 존재하지 않는 모듈로 페이지를 만들 수는 없다.
    const page = mdPageSchema.parse({
      schemaVersion: 1,
      blocks: [{ id: "x", moduleType: "없는모듈", moduleVersion: 1, values: {} }],
    });
    const issues = validatePage(page, MODULE_DEFS);
    expect(issues).toHaveLength(1);
    expect(issues[0].blockId).toBe("x");
  });

  it("정상 페이지는 문제가 없다", () => {
    const page = { schemaVersion: 1 as const, blocks: [blockFromDef(hero, "b1")] };
    expect(validatePage(page, MODULE_DEFS)).toEqual([]);
  });
});

describe("blockFromDef", () => {
  it("sample 값을 복사해 넣는다 — 빈 껍데기를 만들지 않는다", () => {
    const b = blockFromDef(hero, "b1");
    expect(b.values).toEqual(hero.sample);
    expect(b.values).not.toBe(hero.sample); // 원본을 공유하면 편집이 정의를 오염시킨다
  });
});
