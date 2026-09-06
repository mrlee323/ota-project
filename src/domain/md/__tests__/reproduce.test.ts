import { describe, it, expect } from "vitest";
import { MODULE_DEFS } from "../modules";
import { validatePage, mdPageSchema, type MdPage, type MdBlock } from "../page";

// ─── AC-1 · 재현 관문 ───────────────────────────────────────────────────────
//
// 실사한 «실제 기획전» 을 모듈 6종만으로 재현할 수 있어야 한다.
// 픽셀 재현이 아니라 **구조 재현**이다 — 블록의 종류와 순서가 실사와 일치하는가.
//
// 이 테스트를 통과하기 전에는 7번째 모듈을 만들지 않는다.
// 근거 수치는 docs/md/module-survey.md §2 에 있다.

let seq = 0;
const b = (moduleType: string, values: Record<string, unknown> = {}, group?: MdBlock["group"]): MdBlock => ({
  id: `b${++seq}`,
  moduleType,
  moduleVersion: 1,
  values,
  ...(group ? { group } : {}),
});

/** 호텔 한 곳 = 소개 이미지 → 설명 이미지 → CTA (실사 F3 의 반복 묶음) */
const hotelGroup = (n: number, hotelName: string) => {
  const g = { type: "hotel", id: `g${n}` };
  return [
    b("image", { imageUrl: `https://example.com/${n}-name.png`, alt: hotelName }, g),
    b("image", { imageUrl: `https://example.com/${n}-desc.png`, alt: `${hotelName} 설명` }, g),
    b("cta", { label: "지금 구매하기", link: `/hotel/${n}`, style: "primary" }, g),
  ];
};

describe("AC-1 — 실사 기획전 구조 재현", () => {
  it("① 브랜드·다호텔형 (PHR 브랜드 위크, 6355)", () => {
    // 실사: hero → (호텔명 이미지 → 특징 → 가격설명 → CTA) × 호텔 4곳 → 지역 배너 → 유의사항
    // 특징 캐러셀은 v1 에 없으므로 image 로 강등해 표현한다 (survey §3)
    const page: MdPage = {
      schemaVersion: 1,
      blocks: [
        b("hero", { imageUrl: "https://example.com/hero.gif", title: "PHR 브랜드 위크" }),
        ...hotelGroup(1, "류큐 호텔 앤 리조트"),
        ...hotelGroup(2, "프리미어 호텔 오사카"),
        ...hotelGroup(3, "하얏트리젠시 나하"),
        ...hotelGroup(4, "프리미어 호텔 츠바키"),
        b("notes", { title: "유의사항", items: ["본 이벤트는 회원에 한해 제공됩니다."] }),
      ],
    };

    expect(page.blocks.map((x) => x.moduleType)).toEqual([
      "hero",
      ...Array(4).fill(["image", "image", "cta"]).flat(),
      "notes",
    ]);
    expect(validatePage(page, MODULE_DEFS)).toEqual([]);
    expect(() => mdPageSchema.parse(page)).not.toThrow();
  });

  it("② 목적지 테마형 (스페인, 6267)", () => {
    // 실사: hero → 쿠폰 → (이미지 → CTA) × N → 탭/캐러셀/비디오 → 유의사항
    // 쿠폰·탭·비디오는 v2 이므로 image 로 표현한다 — 구조(순서·개수)는 유지된다
    const page: MdPage = {
      schemaVersion: 1,
      blocks: [
        b("hero", { imageUrl: "https://example.com/spain.png", title: "유럽의 첫사랑, 스페인" }),
        b("image", { imageUrl: "https://example.com/coupon.png", alt: "쿠폰 안내" }),
        b("cta", { label: "쿠폰 받기", link: "/coupon" }),
        b("section-title", { title: "도시별 추천 숙소", sectionBgColor: "#F2EBFF" }),
        b("hotel-card-list", { hotelRefs: ["1", "2", "3"], layout: "carousel" }),
        b("image", { imageUrl: "https://example.com/video-thumb.png", alt: "여행 영상" }),
        b("notes", { title: "유의사항", items: ["항공권은 별도입니다."] }),
      ],
    };

    expect(validatePage(page, MODULE_DEFS)).toEqual([]);
    // 실사에서 확인된 특징: 자유 배경색 구간이 있고, 유의사항으로 끝난다
    expect(page.blocks.at(-1)?.moduleType).toBe("notes");
    expect(page.blocks.some((x) => x.values.sectionBgColor)).toBe(true);
  });

  it("③ 허브·특가형 (NOL 특가 허브)", () => {
    // 실사 F5: [섹션 제목 + 상품 카드] 가 11회 반복. 이미지가 아니라 «값» 이다.
    const sections = [
      { title: "특가 TOP 3", refs: ["1", "2", "3"] },
      { title: "이번주 해외숙소 특가", refs: ["4", "5"] },
      { title: "제주 인기 숙소", refs: ["6", "7"] },
    ];

    const page: MdPage = {
      schemaVersion: 1,
      blocks: [
        b("hero", { imageUrl: "https://example.com/hub.png", title: "이번 주 특가 모음" }),
        ...sections.flatMap((s) => [
          b("section-title", { title: s.title }),
          b("hotel-card-list", { hotelRefs: s.refs, layout: "grid" }),
        ]),
        b("notes", { title: "유의사항", items: ["가격은 실시간으로 변동될 수 있습니다."] }),
      ],
    };

    expect(page.blocks.map((x) => x.moduleType)).toEqual([
      "hero",
      "section-title", "hotel-card-list",
      "section-title", "hotel-card-list",
      "section-title", "hotel-card-list",
      "notes",
    ]);
    expect(validatePage(page, MODULE_DEFS)).toEqual([]);

    // 이 유형의 핵심 — 이미지 블록이 하나도 없다 (AC-3 의 근거이기도 하다)
    expect(page.blocks.some((x) => x.moduleType === "image")).toBe(false);
  });

  it("세 유형 모두 모듈 6종 안에서만 만들어진다", () => {
    const allowed = new Set(MODULE_DEFS.map((d) => d.type));
    expect(allowed.size).toBe(6);
    expect([...allowed].sort()).toEqual(
      ["cta", "hero", "hotel-card-list", "image", "notes", "section-title"].sort(),
    );
  });
});
