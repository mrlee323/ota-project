import { describe, it, expect } from "vitest";
import { searchModules } from "../search";
import { MODULE_DEFS } from "../modules";
import type { ModuleDef } from "../moduleDef";

// ─── Q-M3 · 모듈이 늘어도 맞는 걸 고르나 ────────────────────────────────────
//
// 지금 모듈은 6종이라 무엇을 물어도 잘 나온다. 그건 검증이 아니다.
// **변형을 만들어 30종으로 늘려 놓고** 같은 질문을 던져야 «100개일 때» 를 가늠할 수 있다
// (docs/md/mcp.md §8 M1).

/** hero 계열 변형처럼, 이름이 비슷하고 쓰임만 다른 모듈들을 만든다 */
function inflate(base: ModuleDef[]): ModuleDef[] {
  const variants: [string, string, string][] = [
    ["image", "이미지형", "사진 한 장으로 보여줄 때"],
    ["split", "좌우 분할형", "글과 사진을 나란히 놓을 때"],
    ["video", "영상형", "움직이는 화면을 보여줄 때"],
    ["compact", "축약형", "화면을 적게 차지해야 할 때"],
  ];
  const out = [...base];
  for (const d of base) {
    for (const [suffix, label, when] of variants) {
      out.push({
        ...d,
        type: `${d.type}-${suffix}`,
        name: `${d.name} ${label}`,
        whenToUse: `${when}. ${d.whenToUse}`,
      });
    }
  }
  return out;
}

const BIG = inflate(MODULE_DEFS);

describe("Q-M3 — 모듈 30종에서의 검색", () => {
  it("실제로 30종이다", () => {
    expect(BIG.length).toBe(30);
  });

  it("의도로 물으면 여전히 맞는 계열을 고른다", () => {
    const hits = searchModules(BIG, "숙소를 나열하고 예약으로 보내고 싶다", undefined);
    expect(hits[0].type.startsWith("hotel-card-list")).toBe(true);
  });

  it("변형끼리 구분된다 — 「영상」을 물으면 영상형이 위로 온다", () => {
    const hits = searchModules(BIG, "움직이는 화면을 보여주고 싶다");
    expect(hits[0].type).toMatch(/-video$/);
  });

  it("결과가 폭발하지 않는다 — 요약만 주고 상위만 남는다", () => {
    const hits = searchModules(BIG, "이미지");
    // 30개 중 관련된 것만. 전부 돌려주면 컨텍스트가 터진다
    expect(hits.length).toBeLessThan(BIG.length);
  });

  it("요약 한 건이 작다 — 100종이어도 목록이 감당된다", () => {
    const bytes = JSON.stringify(searchModules(BIG, undefined).slice(0, 10)).length;
    // 10건 요약이 4KB 를 넘으면 100종 목록은 못 쓴다
    expect(bytes).toBeLessThan(4000);
  });

  it("전체 정의는 요약보다 훨씬 크다 — 2단계로 나눈 이유", () => {
    const summary = JSON.stringify(searchModules(BIG, undefined)[0]).length;
    const full = JSON.stringify(BIG[0]).length;
    expect(full).toBeGreaterThan(summary * 2);
  });
});
