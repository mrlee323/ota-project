import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MdPageRenderer } from "../MdPageRenderer";
import { blockFromDef, type MdPage } from "@/domain/md/page";
import { hero } from "@/domain/md/modules/hero";

describe("MdPageRenderer — AC-6", () => {
  it("모르는 모듈 타입을 만나도 던지지 않고 나머지를 그린다", () => {
    // 어드민이 새 모듈로 저장한 페이지를, 아직 그 모듈이 배포되지 않은
    // 렌더러가 열어도 나머지 블록은 보여야 한다 (design.md D5 · FR-2.4).
    const page: MdPage = {
      schemaVersion: 1,
      blocks: [
        { id: "unknown-1", moduleType: "아직-없는-모듈", moduleVersion: 1, values: { a: 1 } },
        blockFromDef(hero, "hero-1"),
        { id: "unknown-2", moduleType: "이것도-없음", moduleVersion: 9, values: {} },
      ],
    };

    expect(() => render(<MdPageRenderer page={page} />)).not.toThrow();
    expect(screen.getByText(hero.sample.title as string)).toBeDefined();
  });

  it("빈 페이지도 깨지지 않는다", () => {
    expect(() =>
      render(<MdPageRenderer page={{ schemaVersion: 1, blocks: [] }} />),
    ).not.toThrow();
  });

  it("텍스트를 이미지가 아니라 DOM 에 둔다", () => {
    // 실사 F1 의 문제(텍스트가 이미지 안에 갇힘)를 재생산하지 않는다 (NFR-3)
    const page: MdPage = { schemaVersion: 1, blocks: [blockFromDef(hero, "h")] };
    render(<MdPageRenderer page={page} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(hero.sample.title);
  });
});
