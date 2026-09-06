import { describe, it, expect } from "vitest";
import { blockValueSchema, templateExtractionSchema, toProviderJsonSchema } from "../aiSchema";
import { MODULE_DEFS } from "../modules";
import { hero } from "../modules/hero";
import { cta } from "../modules/cta";
import { notes } from "../modules/notes";
import { SYSTEM_TEMPLATES } from "../template";

describe("blockValueSchema — 모듈 정의에서 만든다", () => {
  it("이미지 필드는 LLM 에게 묻지 않는다", () => {
    // 지어낼 수밖에 없고, 지어낸 URL 은 깨진 이미지가 된다
    const shape = (blockValueSchema(hero) as never as { shape: Record<string, unknown> }).shape;
    expect(Object.keys(shape)).not.toContain("imageUrl");
    expect(Object.keys(shape)).toContain("title");
  });

  it("preset 필드는 enum 이 된다 — 정해진 값 밖으로 못 나간다", () => {
    const s = blockValueSchema(cta);
    expect(s.safeParse({ label: "예약", link: "/x", style: "primary" }).success).toBe(true);
    expect(s.safeParse({ label: "예약", link: "/x", style: "지어낸값" }).success).toBe(false);
  });

  it("repeatable 필드는 배열이 된다", () => {
    const s = blockValueSchema(notes);
    expect(s.safeParse({ title: "유의사항", items: ["a", "b"] }).success).toBe(true);
    expect(s.safeParse({ title: "유의사항", items: "한 줄" }).success).toBe(false);
  });

  it("선택 필드는 없어도 통과한다", () => {
    expect(blockValueSchema(hero).safeParse({ title: "제목" }).success).toBe(true);
  });
});

describe("templateExtractionSchema", () => {
  it("템플릿의 블록마다 슬롯을 만든다", () => {
    const hub = SYSTEM_TEMPLATES.find((t) => t.id === "t3-hub")!;
    const { slots } = templateExtractionSchema(hub, MODULE_DEFS);
    expect(slots.map((s) => s.moduleType)).toEqual(hub.blocks.map((b) => b.moduleType));
  });

  it("같은 모듈이 여러 번 나와도 슬롯 키가 겹치지 않는다", () => {
    const brand = SYSTEM_TEMPLATES.find((t) => t.id === "t1-brand")!;
    const { slots } = templateExtractionSchema(brand, MODULE_DEFS);
    expect(new Set(slots.map((s) => s.key)).size).toBe(slots.length);
  });

  it("모든 시스템 템플릿이 스키마를 만들 수 있다", () => {
    for (const t of SYSTEM_TEMPLATES) {
      const { schema, slots } = templateExtractionSchema(t, MODULE_DEFS);
      expect(slots.length).toBe(t.blocks.length);
      expect(() => toProviderJsonSchema(schema)).not.toThrow();
    }
  });
});

describe("toProviderJsonSchema", () => {
  const hub = SYSTEM_TEMPLATES.find((t) => t.id === "t3-hub")!;
  const json = toProviderJsonSchema(templateExtractionSchema(hub, MODULE_DEFS).schema);

  it("공급자가 안 받는 키를 걷어낸다", () => {
    expect(JSON.stringify(json)).not.toContain("$schema");
    expect(JSON.stringify(json)).not.toContain('"default"');
  });

  it("strict 모드 요건을 맞춘다 — additionalProperties: false 와 required", () => {
    expect(json.additionalProperties).toBe(false);
    expect(Array.isArray(json.required)).toBe(true);
  });

  it("필드 설명이 살아 있다 — 프롬프트에 따로 쓰지 않는 이유다", () => {
    // 모듈 정의의 description 이 스키마를 타고 LLM 에게 전달된다 (FR-1.5)
    expect(JSON.stringify(json)).toContain("description");
  });
});
