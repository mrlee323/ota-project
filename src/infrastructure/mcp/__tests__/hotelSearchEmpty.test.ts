import { describe, it, expect } from "vitest";
import { searchHotelsForMd, explainEmptyHotelSearch } from "@/infrastructure/md/hotelLookup";

// tools.ts 는 server-only 를 import 해서 vitest 에서 열리지 않는다.
// 그래서 0건 응답을 만드는 쪽(hotelLookup)을 직접 확인한다.
describe("search_hotels 0건 — 막다른 길이 아니다 (plan.md Q-M6)", () => {
  it("0건이면 쓸 수 있는 지역과 등급 분포가 함께 온다", async () => {
    // 파일럿에서 왕복을 낭비한 바로 그 조건
    expect(await searchHotelsForMd({ keyword: "오사카", minStars: 4 })).toHaveLength(0);

    const empty = await explainEmptyHotelSearch({ keyword: "오사카", minStars: 4 });

    expect(empty.matched).toBe(0);
    expect(empty.emptyBecause).toBe("keyword");
    expect(empty.available.regions.length).toBeGreaterThan(0);
    expect(empty.available.regions[0]).toMatchObject({
      region: expect.any(String),
      count: expect.any(Number),
    });
    expect(Object.keys(empty.available.stars).length).toBeGreaterThan(0);
    // 조건을 떼면 몇 건이 되는지 — 다음 수를 고를 근거
    expect(empty.relaxed).toEqual(
      expect.arrayContaining([{ drop: "keyword", matched: expect.any(Number) }]),
    );
    expect(empty.relaxed.find((r) => r.drop === "keyword")!.matched).toBeGreaterThan(0);
  });

  it("제안한 지역으로 다시 부르면 실제로 결과가 나온다", async () => {
    const empty = await explainEmptyHotelSearch({ keyword: "오사카", minStars: 4 });
    const { region, stars } = empty.available.regions[0];

    const retry = await searchHotelsForMd({ keyword: region, minStars: Math.min(...stars) });
    expect(retry.length).toBeGreaterThan(0);
  });

  it("조합 때문이면 살아남은 조건 쪽 분포를 준다", async () => {
    // 4성 호텔 이름 + minStars=5 — 각 조건은 살아있지만 합치면 0건
    expect(await searchHotelsForMd({ keyword: "세인트존스", minStars: 5 })).toHaveLength(0);

    const empty = await explainEmptyHotelSearch({ keyword: "세인트존스", minStars: 5 });
    expect(empty.emptyBecause).toBe("combination");
    expect(empty.scope).toContain("keyword");
    // 그 호텔이 실제로 몇 성인지가 available.stars 에 보인다 → minStars 를 얼마로 낮출지 알 수 있다
    expect(Object.keys(empty.available.stars)).toEqual(["4"]);
  });
});
