import { describe, it, expect } from "vitest";
import { validateBlock } from "../moduleDef";
import { hero } from "../modules/hero";
import { MODULE_DEFS, findModuleDef } from "../modules";
import { moduleDefSchema } from "../moduleDef";

describe("모듈 정의", () => {
  it("등록된 모든 모듈이 스키마를 만족한다", () => {
    for (const def of MODULE_DEFS) {
      expect(() => moduleDefSchema.parse(def)).not.toThrow();
    }
  });

  it("모든 모듈의 sample 은 자기 정의를 통과한다", () => {
    // 캔버스가 팔레트에서 모듈을 올릴 때 sample 을 그대로 쓴다 (FR-1.4).
    // sample 이 검증에 걸리면 담당자가 «추가하자마자 오류» 를 본다.
    for (const def of MODULE_DEFS) {
      expect(validateBlock(def, def.sample)).toEqual([]);
    }
  });

  it("type 이 중복되지 않는다", () => {
    const types = MODULE_DEFS.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("validateBlock", () => {
  it("필수 필드가 비면 잡는다", () => {
    const issues = validateBlock(hero, { subtitle: "부제만 있음" });
    expect(issues.map((i) => i.key).sort()).toEqual(["imageUrl", "title"]);
  });

  it("정의에 없는 필드를 거부한다", () => {
    // 캔버스든 MCP 든 LLM 이든 임의 필드를 만들 수 없다 (D6)
    const issues = validateBlock(hero, { ...hero.sample, evilField: "x" });
    expect(issues).toEqual([{ key: "evilField", message: "정의에 없는 필드입니다" }]);
  });

  it("이미지 필드는 http(s) 주소만 받는다", () => {
    const issues = validateBlock(hero, { ...hero.sample, imageUrl: "javascript:alert(1)" });
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe("imageUrl");
  });

  it("선택 필드는 비어도 통과한다", () => {
    const { subtitle: _s, period: _p, ...required } = hero.sample;
    expect(validateBlock(hero, required)).toEqual([]);
  });
});

describe("findModuleDef", () => {
  it("없는 타입이면 undefined 를 준다 — 던지지 않는다", () => {
    expect(findModuleDef("존재하지-않는-모듈")).toBeUndefined();
  });
});
