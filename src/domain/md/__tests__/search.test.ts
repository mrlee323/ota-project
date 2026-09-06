import { describe, it, expect } from "vitest";
import { searchModules, toSummary } from "../search";
import { MODULE_DEFS } from "../modules";
import { hero } from "../modules/hero";

describe("searchModules", () => {
  it("질의가 없으면 전부 준다", () => {
    expect(searchModules(MODULE_DEFS)).toHaveLength(MODULE_DEFS.length);
  });

  it("이름으로 찾는다", () => {
    expect(searchModules(MODULE_DEFS, "히어로")[0].type).toBe("hero");
  });

  it("띄어쓰기를 무시한다 — 「호텔카드」와 「호텔 카드」가 같아야 한다", () => {
    expect(searchModules(MODULE_DEFS, "호텔카드")[0].type).toBe("hotel-card-list");
    expect(searchModules(MODULE_DEFS, "호텔 카드")[0].type).toBe("hotel-card-list");
  });

  it("의도로 찾는다 — whenToUse 가 고르는 근거다", () => {
    // 「숙소를 나열」은 hotel-card-list 의 whenToUse 에만 있다
    expect(searchModules(MODULE_DEFS, "숙소를 나열")[0].type).toBe("hotel-card-list");
  });

  it("카테고리로 거른다", () => {
    const footer = searchModules(MODULE_DEFS, undefined, "푸터");
    expect(footer.every((m) => m.category === "푸터")).toBe(true);
  });

  it("안 맞으면 빈 결과 — 억지로 채우지 않는다", () => {
    expect(searchModules(MODULE_DEFS, "존재하지않는단어xyz")).toEqual([]);
  });

  it("요약에는 필드 정의가 들어가지 않는다 — 컨텍스트를 아끼는 게 목적이다", () => {
    const s = toSummary(hero);
    expect(s).not.toHaveProperty("fields");
    expect(s).not.toHaveProperty("sample");
    expect(s.whenToUse).toBeTruthy();
  });
});
