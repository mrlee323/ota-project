import { describe, it, expect } from "vitest";
import { collectImageContext, buildImagePromptBrief, IMAGE_CONSTRAINTS } from "../imageContext";
import { MODULE_DEFS } from "../modules";
import type { MdPage, MdBlock } from "../page";

const blk = (id: string, moduleType: string, values = {}, group?: MdBlock["group"]): MdBlock => ({
  id, moduleType, moduleVersion: 1, values, ...(group ? { group } : {}),
});

const page: MdPage = {
  schemaVersion: 1,
  blocks: [
    blk("h", "hero", { title: "가을 오사카 특가", subtitle: "최대 30% 할인" }),
    blk("s", "section-title", { title: "이번 주 인기 숙소", sectionBgColor: "#EDE4FF" }),
    blk("img", "image", { alt: "" }),
    blk("n", "notes", { items: ["예약 조건을 확인하세요"] }),
  ],
};

describe("collectImageContext — 서버가 문맥을 붙인다", () => {
  const ctx = collectImageContext(page, "img", MODULE_DEFS, "가을 오사카 특가")!;

  it("앞뒤 블록의 문구를 모은다", () => {
    // 담당자가 프롬프트를 안 써도 «어떤 자리인지» 가 전달돼야 한다
    expect(ctx.nearbyText).toContain("이번 주 인기 숙소");
    expect(ctx.nearbyText).toContain("가을 오사카 특가");
  });

  it("페이지가 쓰는 자유 색을 모은다", () => {
    expect(ctx.colors).toContain("#EDE4FF");
  });

  it("슬롯을 구분한다 — 히어로와 본문은 다른 그림이 필요하다", () => {
    expect(ctx.slot).toBe("body");
    expect(collectImageContext(page, "h", MODULE_DEFS, "제목")!.slot).toBe("hero");
  });

  it("없는 블록이면 null — 던지지 않는다", () => {
    expect(collectImageContext(page, "없는id", MODULE_DEFS, "제목")).toBeNull();
  });

  it("같은 묶음의 문구를 앞세운다", () => {
    // 「이 호텔」 이야기가 옆 구간 이야기보다 우선이다
    const g = { type: "hotel", id: "g1" };
    const grouped: MdPage = {
      schemaVersion: 1,
      blocks: [
        blk("far", "section-title", { title: "다른 구간 제목" }),
        blk("a", "image", { alt: "류큐 호텔 앤 리조트" }, g),
        blk("b", "image", { alt: "" }, g),
        blk("c", "cta", { label: "지금 예약하기" }, g),
      ],
    };
    const c = collectImageContext(grouped, "b", MODULE_DEFS, "브랜드 위크")!;
    // 묶음 문구(호텔명·버튼)가 옆 구간 제목보다 앞에 온다
    const 묶음 = ["류큐 호텔 앤 리조트", "지금 예약하기"];
    const 바깥 = "다른 구간 제목";
    for (const s of 묶음) {
      expect(c.nearbyText.indexOf(s)).toBeGreaterThanOrEqual(0);
      expect(c.nearbyText.indexOf(s)).toBeLessThan(c.nearbyText.indexOf(바깥));
    }
  });
});

describe("IMAGE_CONSTRAINTS — 못 미룰 제약", () => {
  it("이미지에 글자를 넣지 못하게 막는다", () => {
    // 실사 F1 의 문제를 재생산하지 않는 유일한 장치다
    expect(IMAGE_CONSTRAINTS.join(" ")).toMatch(/no text/i);
  });

  it("사람·실제 건물도 막는다", () => {
    const all = IMAGE_CONSTRAINTS.join(" ");
    expect(all).toMatch(/no people|no faces/i);
    expect(all).toMatch(/real hotel|branded property/i);
  });
});

describe("buildImagePromptBrief", () => {
  it("intent 가 없어도 브리프가 만들어진다", () => {
    // 담당자가 아무것도 안 써도 동작해야 한다
    const brief = buildImagePromptBrief(
      collectImageContext(page, "img", MODULE_DEFS, "가을 오사카 특가")!,
    );
    expect(brief).toContain("가을 오사카 특가");
    expect(brief).toContain("Placement");
  });
});
