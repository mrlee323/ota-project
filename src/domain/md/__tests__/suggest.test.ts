import { describe, it, expect } from "vitest";
import { suggestTemplates, suggestModules } from "../suggest";
import { SYSTEM_TEMPLATES } from "../template";
import { MODULE_DEFS } from "../modules";

const top = (intent: string, hotelCount?: number) =>
  suggestTemplates(intent, SYSTEM_TEMPLATES, { hotelCount })[0];

describe("suggestTemplates — 담당자가 못 하는 판단을 대신한다", () => {
  it("브랜드 위크 → 다호텔형", () => {
    expect(top("오사카 프리미어 계열 호텔들을 하나씩 소개하는 브랜드 위크").id).toBe("t1-brand");
  });

  it("시즌 테마 → 목적지 테마형", () => {
    expect(top("가을 교토 단풍 시즌 여행 기획전").id).toBe("t2-theme");
  });

  it("특가 모음 → 허브형", () => {
    expect(top("이번 주 국내 숙소 특가 모음").id).toBe("t3-hub");
  });

  it("단독 이벤트 → 단독형", () => {
    expect(top("글래드 호텔 단독 제휴 이벤트").id).toBe("t4-single");
  });

  it("호텔 개수도 신호다", () => {
    // 같은 문장이라도 대상 수가 다르면 맞는 구성이 다르다
    expect(top("숙소 소개", 8).id).not.toBe("t4-single");
    expect(top("숙소 소개", 1).id).toBe("t4-single");
  });

  it("모든 템플릿이 후보로 남는다 — 억지로 걸러내지 않는다", () => {
    const all = suggestTemplates("아무 말", SYSTEM_TEMPLATES);
    expect(all).toHaveLength(SYSTEM_TEMPLATES.length);
    expect(all.every((s) => s.score >= 1)).toBe(true);
  });

  it("고른 이유를 반드시 준다", () => {
    // 이유가 없으면 호출자도 담당자도 판단할 수 없다
    for (const s of suggestTemplates("가을 특가 모음", SYSTEM_TEMPLATES)) {
      expect(s.why.length).toBeGreaterThan(5);
    }
  });

  it("블록 구성을 함께 준다 — 무엇이 만들어질지 미리 보인다", () => {
    expect(top("특가 모음").blocks).toContain("hotel-card-list");
  });
});

describe("suggestModules", () => {
  it("의도로 모듈을 좁힌다", () => {
    const hits = suggestModules("숙소를 나열하고 예약으로 보내고 싶다", MODULE_DEFS, 3);
    expect(hits[0].type).toBe("hotel-card-list");
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});
